# ACM Module

A reusable Terraform module that requests an AWS ACM (Certificate Manager) TLS
certificate, proves domain ownership via DNS, and waits for ACM to issue the
certificate before returning the ARN to callers.

---

## Overview

AWS services such as CloudFront, ALB, and API Gateway require a valid TLS
certificate to serve HTTPS traffic. This module handles every step:

1. Requests the certificate from ACM.
2. Creates DNS validation records in Route53 (one per covered domain).
3. Waits for ACM to detect the records and issue the certificate.
4. Returns the certificate ARN and metadata so other modules can use it.

Without TLS your users see browser security warnings and their traffic is
unencrypted. This module makes it straightforward to set up TLS correctly.

**Resources created:**

| Resource | Purpose |
|---|---|
| `aws_acm_certificate` | The certificate request sent to ACM |
| `aws_route53_record` | DNS validation CNAME records (one per domain/SAN) |
| `aws_acm_certificate_validation` | Tells Terraform to wait until ACM issues the certificate |

---

## Architecture Diagram

```
Caller (e.g. modules/hosting)
          │
          │  passes: domain_name, zone_id, tags
          ▼
┌─────────────────────────────────┐
│          ACM Module             │
│                                 │
│  1. aws_acm_certificate         │  ← sends certificate request to ACM
│           │                     │
│           │ ACM returns         │
│           │ validation options  │
│           ▼                     │
│  2. aws_route53_record          │  ← publishes CNAME records in Route53
│     (one per domain/SAN)        │
│           │                     │
│           │ ACM polls DNS,      │
│           │ confirms ownership  │
│           ▼                     │
│  3. aws_acm_certificate_        │  ← waits for ACM status = ISSUED
│     validation                  │
└─────────────────────────────────┘
          │
          │  outputs: certificate_arn, validation_options, …
          ▼
CloudFront / ALB / API Gateway
```

**Flow description:**

1. The caller provides a domain name and a Route53 hosted zone ID.
2. ACM receives the certificate request and returns a unique CNAME value per
   domain — this is the DNS challenge.
3. The module creates a Route53 CNAME record with that value.
4. ACM detects the record in DNS and marks the domain as validated.
5. When all domains are validated, ACM issues the certificate.
6. The `aws_acm_certificate_validation` resource unblocks and the ARN is
   returned to the caller.

---

## Resources Created

### `aws_acm_certificate`

Sends the certificate request to AWS Certificate Manager.

- **Where:** in the region specified by `certificate_region` (default `us-east-1`)
- **Why us-east-1?** CloudFront certificates must be in the AWS global region.
- **Key settings:** DNS validation method, `create_before_destroy` lifecycle so
  renewals create a new certificate before the old one is removed.

### `aws_route53_record`

One Route53 CNAME record per domain on the certificate.

- **Why CNAME?** ACM's DNS validation method works by asking you to publish a
  specific CNAME that points to ACM's validation server. When ACM sees it in
  DNS, it knows you control the domain.
- **`for_each`:** creates multiple records automatically — one per domain/SAN —
  rather than repeating the resource block manually.

### `aws_acm_certificate_validation`

A zero-infrastructure resource that pauses Terraform's execution until ACM
reports the certificate is `ISSUED`.

- **Why needed?** Without it Terraform returns the certificate ARN before it is
  usable, and CloudFront or ALB would fail to attach the certificate.
- **Optional:** set `wait_for_validation = false` to skip waiting (advanced use).

---

## Input Variables

| Name | Type | Required | Default | Description |
|---|---|---|---|---|
| `domain_name` | `string` | **Yes** | — | Primary domain for the certificate (e.g. `app.example.com`) |
| `subject_alternative_names` | `list(string)` | No | `[]` | Additional domains covered by the same certificate |
| `zone_id` | `string` | No* | `null` | Route53 hosted zone ID for the default domain |
| `validation_zone_ids` | `map(string)` | No | `{}` | Per-SAN zone overrides — key = domain name, value = zone ID |
| `create_route53_records` | `bool` | No | `true` | Set `false` if DNS is managed outside this module |
| `validation_record_fqdns` | `list(string)` | No | `[]` | External validation FQDNs when `create_route53_records = false` |
| `validation_record_ttl` | `number` | No | `60` | TTL (seconds) for the DNS validation CNAME records |
| `wait_for_validation` | `bool` | No | `true` | When `true`, Terraform waits until the certificate is `ISSUED` |
| `certificate_region` | `string` | No | `"us-east-1"` | AWS region for the certificate; must be `us-east-1` for CloudFront |
| `key_algorithm` | `string` | No | `"RSA_2048"` | Cryptographic algorithm: `RSA_2048`, `EC_prime256v1`, etc. |
| `certificate_transparency_logging_enabled` | `bool` | No | `true` | Publishes the certificate to the public CT log |
| `tags` | `map(string)` | No | `{}` | Resource tags applied to the certificate and Route53 records |

\* `zone_id` is required whenever `create_route53_records = true` and at least
one domain is not covered by `validation_zone_ids`.

---

## Output Variables

| Name | Description |
|---|---|
| `certificate_arn` | ARN of the issued certificate — pass this to CloudFront / ALB |
| `certificate_domain_name` | Primary domain name as stored on the certificate |
| `certificate_status` | Current status: `PENDING_VALIDATION`, `ISSUED`, `FAILED`, etc. |
| `subject_alternative_names` | Final SAN list as confirmed by ACM |
| `validation_record_fqdns` | FQDNs of all DNS validation records (internal + external) |
| `validation_options` | Map of `domain → {record_name, record_type, record_value}` for external DNS |

---

## Example Usage

### Scenario A — CloudFront certificate (most common)

```hcl
# Request a certificate for a CloudFront distribution.
# The certificate is created in us-east-1 (default) as required by CloudFront.
# Route53 validation records are created automatically.

module "frontend_certificate" {
  source = "./modules/acm"

  # The primary domain the certificate will protect.
  domain_name = "app.example.com"

  # Additional domains on the same certificate.
  subject_alternative_names = [
    "www.app.example.com",
  ]

  # The Route53 hosted zone that manages example.com.
  zone_id = "Z1234567890ABC"

  # CloudFront requires us-east-1 — this is the default.
  certificate_region = "us-east-1"

  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}

# Use the certificate ARN in a CloudFront distribution.
# module.frontend_certificate.certificate_arn is only available after
# ACM has finished issuing (because wait_for_validation = true by default).
```

### Scenario B — SANs in different Route53 zones

```hcl
# "app.example.com" is in zone ZAAA
# "api.example.net" is in a separate zone ZBBB

module "multi_zone_certificate" {
  source = "./modules/acm"

  domain_name = "app.example.com"

  subject_alternative_names = ["api.example.net"]

  # Default zone for domains not listed in validation_zone_ids.
  zone_id = "ZAAA111111111"

  # Override the zone for the SAN that lives elsewhere.
  validation_zone_ids = {
    "api.example.net" = "ZBBB222222222"
  }

  certificate_region = "us-east-1"

  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}
```

### Scenario C — External DNS (not managed by this module)

```hcl
# Use this when DNS records must be created outside Terraform
# (e.g. a third-party DNS provider or a separate Terraform state).

module "external_dns_certificate" {
  source = "./modules/acm"

  domain_name = "app.example.com"

  # Do NOT create Route53 records — DNS is managed elsewhere.
  create_route53_records = false

  # Tell the module which FQDNs the external system has created.
  # Retrieve these from module.external_dns_certificate.validation_options
  # after the first apply.
  validation_record_fqdns = [
    "_abc123.app.example.com",
  ]

  certificate_region = "us-east-1"

  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }
}
```

---

## How It Works — Step by Step

1. **Terraform reads variables** — validates `domain_name`, `subject_alternative_names`,
   zone IDs, and other inputs before touching AWS.

2. **locals.tf computes derived values** — strips whitespace, deduplicates
   domains, and resolves which Route53 zone belongs to each domain.

3. **Preconditions run** — Terraform checks that every domain has a zone ID
   (if Route53 management is enabled) and that external FQDNs or
   `wait_for_validation = false` are set when management is disabled.

4. **`aws_acm_certificate` is created** — ACM receives the request and enters
   `PENDING_VALIDATION` status. It also returns one DNS challenge entry per
   domain (`domain_validation_options`).

5. **locals.tf reshapes domain_validation_options** — converts the ACM response
   into a map keyed by domain name so `for_each` can iterate over it.

6. **`aws_route53_record` resources are created** — one CNAME per domain.
   `for_each` creates all records in parallel. Each record points a subdomain
   chosen by ACM (`_abc123.app.example.com`) to ACM's validation service.

7. **ACM polls DNS** — ACM checks up to once per hour. When it detects the
   CNAME it marks that domain as validated.

8. **`aws_acm_certificate_validation` unblocks** — once all domains are
   validated ACM issues the certificate. This resource watches for the
   `ISSUED` status and then Terraform continues.

9. **Outputs are resolved** — `certificate_arn`, `certificate_status`, and
   other values are available to the calling module.

---

## Understanding the Key Concepts

### `for_each`

`for_each` lets one resource block create multiple instances at once.

```hcl
resource "aws_route53_record" "this" {
  for_each = local.validation_records   # a map keyed by domain name

  name    = each.value.name   # each.value = the map entry for this iteration
  records = [each.value.record]
  zone_id = each.value.zone_id
}
```

- `local.validation_records` is a map like `{"app.example.com" = {...}, "www.example.com" = {...}}`.
- Terraform creates one `aws_route53_record` per key.
- `each.key` is the domain name (e.g. `"app.example.com"`).
- `each.value` is the details object for that domain.

**Why not a `count` with a list?** Maps are safer because Terraform tracks
instances by their key. If you add a domain in the middle of a list, count-based
resources shift their indices and Terraform destroys and re-creates unrelated
records. Map keys stay stable.

---

### `count`

`count` creates 0 or N copies of a resource.

```hcl
resource "aws_acm_certificate_validation" "this" {
  count = var.wait_for_validation ? 1 : 0
  ...
}
```

- `count = 1` → the resource exists.
- `count = 0` → the resource does not exist and Terraform skips it entirely.
- When count is 1, reference the resource as `aws_acm_certificate_validation.this[0]`.

---

### Locals

Locals compute intermediate values once and give them readable names.

```hcl
locals {
  # Instead of writing trimspace(var.domain_name) everywhere, use this.
  primary_domain_name = trimspace(var.domain_name)
}
```

Think of locals like variables in a programming language — they avoid
repeating the same expression in multiple places.

---

### Lifecycle `create_before_destroy`

When a certificate must be replaced (e.g. adding a new SAN), Terraform's
default behaviour destroys the old resource first, then creates the new one.
During that gap there is no valid certificate.

`create_before_destroy = true` reverses this: the new certificate is created
first, then the old one is destroyed. CloudFront keeps serving with the old
certificate right up until the new one is attached.

---

### Lifecycle `precondition`

Preconditions are rules that Terraform checks **before** modifying
infrastructure. If a precondition fails, the apply stops with a clear message.

```hcl
precondition {
  condition     = !var.create_route53_records || length(local.missing_validation_zone_domains) == 0
  error_message = "..."
}
```

This is better than finding out something is wrong after ACM has already
created a certificate that cannot be validated.

---

### Conditional expressions

```hcl
var.certificate_transparency_logging_enabled ? "ENABLED" : "DISABLED"
```

This is `condition ? value_if_true : value_if_false` — the same ternary
operator found in many programming languages.

---

### Provider alias

```hcl
provider "aws" {
  alias  = "certificate"
  region = "us-east-1"
}
```

This lets one Terraform plan target multiple AWS regions at the same time.
Resources that use `provider = aws.certificate` go to `us-east-1`.
Resources that use the default provider (no alias) go to the main region.

---

## Troubleshooting

### Certificate stuck in PENDING_VALIDATION

**Symptom:** apply hangs for more than 15 minutes or `certificate_status` stays
as `PENDING_VALIDATION`.

**Causes and fixes:**

- The Route53 validation CNAME was not created. Check `terraform state show
  module.<name>.aws_route53_record.this` to confirm records exist.
- The domain uses a different DNS provider (not Route53). Set
  `create_route53_records = false` and create the records manually.
  Use `module.<name>.validation_options` to find the exact record values.
- DNS propagation is slow. The CNAME TTL is 60 seconds; wait and retry.
- You are trying to validate a domain that belongs to someone else. Confirm
  you control the Route53 zone.

---

### "CloudFront ACM certificate must be in us-east-1"

**Cause:** CloudFront only accepts certificates from the `us-east-1` region.

**Fix:** Ensure `certificate_region = "us-east-1"` (the default).
Check that no parent module is overriding it.

---

### "zone_id or validation_zone_ids must provide a hosted zone ID for every requested domain"

**Cause:** A SAN is not covered by `zone_id` and has no entry in
`validation_zone_ids`.

**Fix:** Either set `zone_id` to the shared zone for all domains, or add an
entry to `validation_zone_ids` for every SAN in a different zone.

---

### "provide validation_record_fqdns or set wait_for_validation to false"

**Cause:** `create_route53_records = false` was set but no external FQDNs and
no `wait_for_validation = false` were provided.

**Fix:** Either:
1. Add `validation_record_fqdns = [...]` with the FQDNs created externally, OR
2. Add `wait_for_validation = false` if you do not need Terraform to wait.

---

### Certificate creation fails with a duplicate error

**Cause:** An identical certificate (same domain + SANs) already exists in ACM.

**Fix:** Import the existing certificate or delete it in the AWS Console first.
ACM allows up to 20 certificates per domain per year — this limit resets
annually.

---

## Best Practices

### Why DNS validation instead of email?

DNS validation is preferred because:
- It is fully automated — no human needs to click a link in an email.
- The validation CNAME record stays in place permanently, so ACM can renew the
  certificate automatically without any manual action.
- Email validation fails if the domain's whois contacts are out of date.

### Why `create_before_destroy`?

When a certificate change is needed (adding a SAN, changing the algorithm), AWS
creates a brand-new certificate. Without this flag there would be a period
where the old certificate is deleted but the new one is not yet attached to
CloudFront. `create_before_destroy` eliminates that gap.

### Why certificate transparency logging?

CT logs are a browser requirement. If this is disabled, Chrome and Firefox show
a warning to users. Leave it enabled unless your security team has a documented
reason to opt out.

### Why `RSA_2048` as the default key algorithm?

RSA 2048-bit keys are the AWS-recommended baseline. They work with every client,
including older devices and browsers. EC keys are faster but not universally
supported. Use EC only after confirming your client requirements.

### Why is `wait_for_validation` on by default?

Dependent resources (CloudFront distributions, ALB listeners) cannot use a
certificate that is still in `PENDING_VALIDATION`. Waiting ensures the rest of
the apply succeeds on the first attempt rather than requiring a second `apply`
run.
