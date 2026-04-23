# Hosting Module

A beginner-friendly, production-ready Terraform module for hosting a static
website on AWS. It combines four child modules (S3, ACM, CloudFront, Route53)
into a single, easy-to-use interface.

---

## Overview

This module provisions everything required to host a secure, globally-distributed
static website on AWS:

| What | Why |
|---|---|
| S3 bucket for website files | Durable, cheap object storage for HTML/CSS/JS |
| S3 bucket for access logs | Stores CloudFront request logs for debugging and analytics |
| ACM TLS certificate | Enables HTTPS on your custom domain (free, auto-renewing) |
| CloudFront CDN distribution | Delivers files fast from 400+ global edge locations |
| Route53 DNS alias records | Maps your domain name to the CloudFront distribution |

---

## Architecture Diagram

```
Browser (user visits learn.example.com)
          │
          ▼
     Route53 DNS
   (ALIAS record → CloudFront)
          │
          ▼
    CloudFront CDN
 ┌────────────────────────────┐
 │  TLS termination (ACM cert)│
 │  Edge caching worldwide    │
 │  WAF (optional)            │
 └────────────────────────────┘
          │
    ┌─────┴──────────────┐
    │                     │
    ▼                     ▼
S3 Frontend          Custom Origin
(HTML/CSS/JS)    (API/ALB - optional)
[Private bucket,
 read via OAC]
```

**Request flow explained:**

1. User types `learn.example.com` in their browser.
2. DNS lookup resolves via Route53 ALIAS record → CloudFront IP.
3. CloudFront checks its edge cache. If cached → returns immediately.
4. Cache miss → CloudFront fetches from S3 (frontend origin) using Origin Access Control.
5. S3 returns the file. CloudFront caches it and returns it to the user.
6. All traffic is HTTPS — enforced at the CloudFront layer.

---

## Resources Created

| Resource | Description |
|---|---|
| `aws_s3_bucket` (frontend) | Stores your website's static files |
| `aws_s3_bucket` (logs) | Receives CloudFront access log files |
| `aws_s3_bucket_versioning` | Keeps previous file versions for rollback |
| `aws_s3_bucket_server_side_encryption_configuration` | Encrypts objects at rest |
| `aws_s3_bucket_public_access_block` | Blocks all public S3 access |
| `aws_s3_bucket_policy` | Allows CloudFront OAC + enforces TLS |
| `aws_acm_certificate` | TLS certificate for your domain (in us-east-1) |
| `aws_route53_record` (validation) | CNAME records for ACM to verify domain ownership |
| `aws_acm_certificate_validation` | Waits for the cert to be issued |
| `aws_cloudfront_origin_access_control` | Grants CloudFront permission to read S3 privately |
| `aws_cloudfront_distribution` | The global CDN that serves your website |
| `aws_route53_record` (alias) | A/AAAA records pointing your domain at CloudFront |

---

## Input Variables

### Required

| Name | Type | Description | Example |
|---|---|---|---|
| `project_name` | `string` | Short project identifier for resource names and tags | `"kjl"` |
| `environment` | `string` | Deployment tier (dev, staging, prod) | `"prod"` |
| `domain_name` | `string` | Primary domain for certificate and default DNS record | `"learn.example.com"` |
| `zone_id` | `string` | Route53 hosted zone ID for DNS and certificate validation | `"Z1D633PJN98FT9"` |

### Optional — Domain

| Name | Type | Default | Description |
|---|---|---|---|
| `subject_alternative_names` | `list(string)` | `[]` | Additional domains on the certificate (SANs) |
| `aliases` | `list(string)` | `null` | Override CloudFront aliases (default: all cert domains) |

### Optional — Storage

| Name | Type | Default | Description |
|---|---|---|---|
| `buckets` | `object` | n/a | Combined frontend and logging bucket settings (`frontend` and `logging` blocks) |
| `additional_origins` | `map(object)` | `{}` | Extra CloudFront origins (APIs, ALBs) keyed by origin ID |

### Optional — CloudFront

| Name | Type | Default | Description |
|---|---|---|---|
| `cloudfront` | `object` | `{}` | Distribution settings: price class, WAF, cache behaviors, error pages |

### Optional — DNS

| Name | Type | Default | Description |
|---|---|---|---|
| `create_dns_records` | `bool` | `true` | Set `false` to skip Route53 record creation |
| `dns_records` | `map(object)` | `{}` | Explicit A/AAAA records (default: one A record for domain_name) |
| `primary_dns_record_key` | `string` | `null` | Which dns_records key drives the `fqdn` output |

### Optional — Certificate

| Name | Type | Default | Description |
|---|---|---|---|
| `certificate` | `object` | `{}` | ACM settings: region, key algorithm, validation method |

### Optional — Tags

| Name | Type | Default | Description |
|---|---|---|---|
| `tags` | `map(string)` | `{}` | Extra tags merged with module defaults |

---

## Output Variables

### S3 Buckets

| Output | Description |
|---|---|
| `frontend_bucket_name` | Name of the website files bucket |
| `log_bucket_name` | Name of the CloudFront log bucket (null if logging disabled) |
| `frontend_bucket` | Full structured metadata for the frontend bucket |
| `logging_bucket` | Full structured metadata for the log bucket (null if disabled) |
| `bucket_names` | Map of all bucket names: `{ "frontend" = "...", "logs" = "..." }` |
| `bucket_arns` | Map of all bucket ARNs |
| `bucket_ids` | Map of all bucket IDs |

### CloudFront

| Output | Description |
|---|---|
| `cloudfront_domain_name` | Auto-assigned domain: `d1234.cloudfront.net` |
| `distribution_id` | Distribution ID for cache invalidation |
| `distribution_arn` | ARN for IAM policies and WAF |
| `cloudfront_distribution` | Full structured distribution metadata |
| `cloudfront_aliases` | Custom domain aliases on the distribution |
| `origin_access_control_id` | OAC ID for debugging S3 permission issues |

### TLS Certificate

| Output | Description |
|---|---|
| `certificate_arn` | ACM certificate ARN |
| `certificate` | Structured object: ARN, domain, status, SANs, validation FQDNs |
| `validation_record_fqdns` | CNAME FQDNs ACM uses for renewal (keep in DNS permanently) |

### DNS

| Output | Description |
|---|---|
| `fqdn` | Primary website URL (e.g. `learn.example.com`) |
| `dns_record_ids` | Map of Route53 record IDs by logical key |
| `dns_record_fqdns` | Map of Route53 record FQDNs by logical key |

---

## Minimal Example Usage

Copy into your root module (`infra/terraform/main.tf`):

```hcl
module "hosting" {
  source = "./modules/hosting"

  project_name = "myapp"
  environment  = "prod"
  domain_name  = "www.example.com"
  zone_id      = "Z1D633PJN98FT9"
}

# Access outputs
output "website_url" {
  value = module.hosting.fqdn
}

output "invalidation_id" {
  value = module.hosting.distribution_id
}
```

This minimal call creates:
- `myapp-prod-frontend` S3 bucket
- `myapp-prod-cloudfront-logs` S3 bucket
- ACM certificate for `www.example.com` in us-east-1
- CloudFront distribution with HTTPS, compression, and security headers
- Route53 A record for `www.example.com`

See `example.tf` in this directory for a full production example with
custom cache behaviors, SPA routing, WAF, IPv6, and all configuration options.

---

## How It Works — Step-by-Step

1. **S3 module runs first.**
   Creates the `frontend` bucket (and optional `logs` bucket).
   Both are private — no public access allowed.

2. **ACM module runs.**
   Requests a TLS certificate for your domain(s) in us-east-1.
   Creates a CNAME validation record in Route53 automatically.
   Waits until ACM marks the certificate "ISSUED" before continuing.

3. **CloudFront module runs.**
   Creates an Origin Access Control (OAC) that grants CloudFront
   permission to read the private S3 bucket using SigV4.
   Creates the distribution with the ACM certificate attached.
   Creates a bucket policy on the S3 bucket allowing OAC access.

4. **Route53 module runs (if enabled).**
   Creates ALIAS records pointing your domain at `*.cloudfront.net`.
   ALIAS records are free, work on apex domains, and auto-follow CloudFront IPs.

---

## Understanding Key Terraform Concepts

### `for_each`

`for_each` creates one resource per item in a map or set.

```hcl
# The s3 module uses for_each internally on the buckets variable.
# This creates one S3 bucket for every key in the map:
#   "frontend" → aws_s3_bucket["frontend"]
#   "logs"     → aws_s3_bucket["logs"]
buckets = {
  frontend = { bucket_name = "kjl-prod-frontend", ... }
  logs     = { bucket_name = "kjl-prod-logs",     ... }
}
```

Why use `for_each` instead of separate resources?
Less code duplication. One bucket resource definition creates both buckets.
Adding a third bucket only requires adding a map entry — no new resource blocks.

### `dynamic` blocks

Dynamic blocks generate repeated nested blocks based on a list or map.

```hcl
# Without dynamic: you would need one cors_rule block per rule — impossible
# when the number of rules varies.
dynamic "cors_rule" {
  for_each = var.cors_rules   # one block per rule
  content {
    allowed_origins = cors_rule.value.origins
  }
}
```

The `content {}` block is the template. It runs once per item in `for_each`.

### `locals`

Locals are computed-once internal variables. They cannot be set by callers.

```hcl
# Without locals, this expression would appear 4 times across the module:
distinct(compact(concat([var.domain_name], var.subject_alternative_names)))

# With locals, it is computed once and referenced everywhere:
locals {
  certificate_domains = distinct(compact(concat(...)))
}
```

### `try()` function

`try(expression, fallback)` evaluates the expression. If it would cause an error
(e.g. accessing a field that doesn't exist), it returns `fallback` instead.

```hcl
# var.buckets.frontend might be {} (no name field).
# Without try: Terraform errors on "buckets.frontend.name does not exist".
# With try: returns null safely, coalesce then picks the generated name.
try(var.buckets.frontend.name, null)
```

### IAM / S3 bucket policies

The S3 bucket has a **bucket policy** — a JSON document that controls who can access it.

This module attaches two policy statements:

1. **CloudFront OAC read access** — allows `s3:GetObject` from the CloudFront service
   principal only when the request is signed with the specific OAC ID.
   This is why the bucket can be private yet CloudFront can still read files.

2. **TLS-only policy** — denies any request that does not use HTTPS (`aws:SecureTransport`).
   Prevents unintentional clear-text S3 API calls.

### Implicit dependencies

When module B references an output from module A, Terraform automatically
creates a dependency edge and ensures A finishes before B starts.

```hcl
# cloudfront module uses the certificate ARN from the acm module output.
# Terraform sees this and waits for ACM to complete first.
acm_certificate_arn = module.acm.certificate_arn
```

You only need `depends_on` when a dependency cannot be expressed through references.

### `count = 0` / optional modules

```hcl
module "route53" {
  count = var.create_dns_records ? 1 : 0
  ...
}
```

`count = 1` → one module instance is created.
`count = 0` → module is completely skipped. No resources are created.

Access the module output only when count > 0:

```hcl
# Safe: uses a ternary to guard the [0] index
value = var.create_dns_records ? module.route53[0].fqdn : null
```

---

## Common Issues & Troubleshooting

### Certificate remains `PENDING_VALIDATION` forever

**Cause:** The ACM validation CNAME record was not created in Route53.

**Check:**
```bash
aws acm describe-certificate --certificate-arn <arn> --region us-east-1
```
Look for `DomainValidationOptions[].ValidationStatus`.

**Fix:**
- Ensure `zone_id` is correct (must match the hosted zone for `domain_name`).
- Ensure `certificate.create_route53_records = true` (the default).
- The validation CNAME and the hosted zone must be in the same DNS tree.

---

### CloudFront returns `403 Forbidden` for every file

**Cause (most common):** The S3 bucket policy does not allow the CloudFront OAC.

**Check:**
1. Go to the S3 bucket → Permissions → Bucket Policy.
2. Verify there is a statement with `"Principal": {"Service": "cloudfront.amazonaws.com"}`.
3. Verify the `Condition` references the correct CloudFront distribution ARN.

**Fix:** Re-run `terraform apply`. The CloudFront module writes the OAC bucket
policy automatically using `manage_bucket_policy = true`.

---

### CloudFront returns `403 Forbidden` only for unknown paths (SPA issue)

**Cause:** S3 returns 403 (or 404) for paths like `/about` that don't exist as S3 objects.
For Single-Page Apps, the JavaScript router handles these paths client-side.

**Fix:** Add custom error responses to remap S3 403/404 to your `index.html`:

```hcl
cloudfront = {
  custom_error_responses = [
    { error_code = 403, response_code = 200, response_page_path = "/index.html" },
    { error_code = 404, response_code = 200, response_page_path = "/index.html" }
  ]
}
```

---

### Certificate error: "Certificate must be in us-east-1"

**Cause:** You set `certificate.certificate_region` to a region other than us-east-1,
or a previous cert was created in the wrong region.

**Fix:** Do not set `certificate_region` — the default (`us-east-1`) is correct.
CloudFront is a global edge service; it only accepts certs from us-east-1.

---

### `Error: Invalid for_each argument — value depends on resource attributes`

**Cause:** You are using a `for_each` map where the keys depend on a resource
that hasn't been created yet (Terraform can't determine keys at plan time).

**Fix:** Use static, known-at-plan-time values as map keys:

```hcl
# Bad: resource ID is unknown at plan time
{ (aws_s3_bucket.this.id) = ... }

# Good: a static string key
{ "frontend" = ... }
```

---

### Route53 record conflict: "RRSet already exists"

**Cause:** A record with the same name and type already exists in the hosted zone
(created manually or by a previous Terraform workspace).

**Fix options:**
1. Delete the existing record in the AWS Console, then re-run `terraform apply`.
2. Import the existing record: `terraform import module.hosting.module.route53[0].aws_route53_record.this ...`
3. Set `create_dns_records = false` and manage records separately.

---

## Security Best Practices Explained

### Why are public access blocks set to true?

The S3 bucket stores website files that CloudFront serves. The bucket itself
should never be publicly accessible — users must go through CloudFront.

CloudFront enforces HTTPS, can attach WAF rules, and hides the S3 endpoint.
If the bucket were public, attackers could bypass CloudFront and access files
directly over HTTP or enumerate bucket contents.

### Why is Origin Access Control (OAC) used instead of a public bucket?

OAC is the modern AWS-recommended way to grant CloudFront access to a private bucket.
It uses AWS Signature Version 4 (SigV4) to sign every request from CloudFront to S3.
S3 verifies the signature and only allows requests originating from the specific
CloudFront distribution — not from any other distribution or direct HTTP clients.

### Why is TLS enforced (attach_tls_only_policy)?

The `attach_tls_only_policy = true` setting adds an S3 bucket policy that denies
any request where `aws:SecureTransport = false`. This prevents:
- Clear-text reads of website files via the S3 API (e.g. `aws s3 cp` over HTTP)
- Potential data exposure on internal AWS networks

### Why is minimum_protocol_version = "TLSv1.2_2021"?

TLS 1.0 and 1.1 have known vulnerabilities (POODLE, BEAST, SWEET32).
All modern browsers support TLS 1.2+. Disabling old versions removes attack surface.

### Why is certificate transparency logging enabled?

Certificate Transparency (CT) logs are public append-only ledgers of every
TLS certificate issued. They let defenders detect mis-issued or rogue certificates
for their domain. Many browsers require CT compliance. Keep this enabled.

### Why is versioning enabled on the frontend bucket?

If a bad deployment overwrites `index.html` or other assets, S3 versioning lets
you restore the previous version without redeploying. It also protects against
accidental `aws s3 rm` commands that could wipe the website.
