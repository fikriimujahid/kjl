# CloudFront Module

A reusable Terraform module that provisions an AWS CloudFront distribution
with secure defaults, configurable origins, explicit cache behaviors, and
automatic S3 bucket policy management using Origin Access Control (OAC).

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Resources Created](#resources-created)
4. [Requirements](#requirements)
5. [Input Variables](#input-variables)
6. [Output Values](#output-values)
7. [Example Usage](#example-usage)
8. [How It Works — Step by Step](#how-it-works--step-by-step)
9. [Understanding Key Terraform Concepts](#understanding-key-terraform-concepts)
10. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
11. [Best Practices](#best-practices)

---

## Overview

AWS CloudFront is a **Content Delivery Network (CDN)**.  It sits in front of
your backend (S3 bucket, API server, etc.) and:

- Caches your content at **edge locations** around the world so users get
  faster responses regardless of where your origin server is.
- Terminates **TLS (HTTPS)** at the edge, so your origin can stay private.
- Enforces **security headers**, geo-restrictions, and WAF rules before a
  request ever hits your origin.

This module wraps the `aws_cloudfront_distribution` Terraform resource and
adds:

- Automatic **Origin Access Control (OAC)** for private S3 buckets —
  so only CloudFront can read your bucket, not the public internet.
- Auto-generated, security-hardened **S3 bucket policies** with TLS enforcement.
- Sensible secure defaults (HTTPS redirect, TLS v1.2, security headers policy).
- Clear validation errors that catch misconfiguration before AWS is called.

---

## Architecture

```
Browser / Mobile App
        │
        │ HTTPS (TLS 1.2+)
        ▼
┌───────────────────────────────────────────────────────┐
│             AWS CloudFront Distribution               │
│                                                       │
│  ┌──────────────────────────────────────────────┐     │
│  │  Cache Behaviors (evaluated in order)        │     │
│  │                                              │     │
│  │  1. /api/*  ──────────────────────────────► API   │
│  │  2. default (all other paths)  ──────────► S3 │   │
│  └──────────────────────────────────────────────┘     │
│                                                       │
│  ┌──────────────────────────────────────────────┐     │
│  │  Features                                    │     │
│  │  - WAF (optional)                            │     │
│  │  - Geo restriction (optional)                │     │
│  │  - Access logging (optional)                 │     │
│  │  - Custom domain + ACM certificate           │     │
│  └──────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────┘
         │                              │
         │ SigV4-signed                 │ HTTPS
         │ (OAC)                        │
         ▼                              ▼
┌─────────────────┐          ┌──────────────────────┐
│  Amazon S3      │          │  Custom Origin        │
│  (private)      │          │  (ALB / API Gateway / │
│                 │          │   any HTTPS server)   │
└─────────────────┘          └──────────────────────┘
```

---

## Resources Created

| Resource | Description |
|---|---|
| `aws_cloudfront_distribution` | The CloudFront distribution — the core resource |
| `aws_cloudfront_origin_access_control` | OAC for S3 origins (created when `origin_access_control.create = true`) |
| `aws_s3_bucket_policy` | Bucket policy for each managed S3 origin (one per origin with `manage_bucket_policy = true`) |
| `data.aws_iam_policy_document` | Rendered JSON for the S3 bucket policies (data source, not deployable resources) |

---

## Requirements

| Tool | Minimum Version |
|---|---|
| Terraform CLI | `>= 1.5.0` |
| AWS Provider | `~> 5.0` |

The calling root module must configure an `aws` provider, including the region.

---

## Input Variables

> Variables marked **Required** have no default value — the caller must always set them.
> Variables marked **Optional** use the documented default when not set.

### Naming

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `project_name` | `string` | **Required** | Short project identifier, e.g. `"kjl"`. Used in auto‑generated resource names. |
| `environment` | `string` | **Required** | Deployment stage, e.g. `"prod"` or `"dev"`. |
| `distribution_name` | `string` | `null` | Override the auto-generated display name `<project>-<env>-cloudfront`. |
| `comment` | `string` | `null` | Free-text label shown in the AWS Console. Defaults to `distribution_name`. |

### Distribution Flags

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `enabled` | `bool` | `true` | Whether the distribution is live and serving traffic. |
| `is_ipv6_enabled` | `bool` | `true` | Allow IPv6 clients. Recommended `true`. |
| `wait_for_deployment` | `bool` | `true` | Block `terraform apply` until CloudFront reports `Deployed` (5–15 min). |
| `retain_on_delete` | `bool` | `false` | Disable instead of delete on `terraform destroy`. Useful in production. |
| `http_version` | `string` | `"http2and3"` | Highest HTTP version negotiated with browsers. Options: `http1.1`, `http2`, `http2and3`, `http3`. |
| `continuous_deployment_policy_id` | `string` | `null` | Link to a CloudFront continuous deployment policy for blue/green rollouts. |

### Origins

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `origins` | `map(object)` | **Required** | Map of origin definitions. Map key = CloudFront origin ID. See [Origins in detail](#origins-in-detail). |

#### Origins in detail

Each entry in the `origins` map is an object with these fields:

| Field | Type | Default | Description |
|---|---|---|---|
| `domain_name` | `string` | **Required** | DNS hostname CloudFront connects to, e.g. `mybucket.s3.amazonaws.com`. |
| `origin_type` | `string` | **Required** | `"s3"` for S3 buckets; `"custom"` for everything else. |
| `origin_path` | `string` | `null` | Path prefix prepended to forwarded requests. |
| `connection_attempts` | `number` | `3` | Retry count on failed TCP connections (1–3). |
| `connection_timeout` | `number` | `10` | Seconds before TCP timeout (1–10). |
| `custom_headers` | `map(string)` | `{}` | Headers injected into origin requests. |
| `custom_origin_config` | `object` | — | Required for `"custom"` origins (see below). |
| `origin_shield` | `object` | — | Optional extra caching tier. |
| `s3_config` | `object` | — | S3-specific settings (see below). |

`custom_origin_config` sub-fields:

| Field | Default | Description |
|---|---|---|
| `http_port` | `80` | HTTP port on the origin. |
| `https_port` | `443` | HTTPS port on the origin. |
| `origin_protocol_policy` | `"https-only"` | `http-only`, `https-only`, or `match-viewer`. |
| `origin_ssl_protocols` | `["TLSv1.2"]` | TLS versions to accept from the origin's certificate. |
| `origin_keepalive_timeout` | `5` | Seconds to keep idle connections open (1–60). |
| `origin_read_timeout` | `30` | Seconds to wait for origin response (1–60). |

`s3_config` sub-fields:

| Field | Default | Description |
|---|---|---|
| `bucket_name` | derived from `domain_name` | Explicit bucket name for IAM policy ARN construction. |
| `manage_bucket_policy` | `true` | When `true`, the module creates and attaches the S3 bucket policy. |

### Cache Behaviors

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `default_cache_behavior` | `object` | **Required** | Applied to all requests that don't match an ordered behavior. See fields below. |
| `ordered_cache_behaviors` | `list(object)` | `[]` | Evaluated before the default. First path_pattern match wins. |
| `custom_error_responses` | `list(object)` | `[]` | Override what CloudFront returns when origin responds with 4xx/5xx. |

`default_cache_behavior` and `ordered_cache_behaviors` item fields:

| Field | Default | Description |
|---|---|---|
| `target_origin_id` | **Required** | Must match a key from `var.origins`. |
| `path_pattern` | **Required** (ordered only) | URL pattern, e.g. `"/api/*"`. |
| `viewer_protocol_policy` | `"redirect-to-https"` | `allow-all`, `https-only`, or `redirect-to-https`. |
| `allowed_methods` | `["GET","HEAD","OPTIONS"]` | HTTP methods CloudFront accepts from viewers. |
| `cached_methods` | `["GET","HEAD","OPTIONS"]` | Methods whose responses are cached. Must be a subset of `allowed_methods`. |
| `compress` | `true` | Enable gzip/Brotli response compression. |
| `cache_policy_id` | AWS CachingOptimized | Controls what forms the cache key and TTLs. |
| `response_headers_policy_id` | AWS SecurityHeadersPolicy | Adds security headers (HSTS, X-Frame-Options, etc.). |
| `origin_request_policy_id` | `null` | Controls which headers/cookies/params are forwarded to the origin. |
| `lambda_function_associations` | `[]` | Lambda@Edge functions at viewer/origin request/response events. |
| `function_associations` | `[]` | Lightweight CloudFront Functions at viewer events. |

`custom_error_responses` item fields:

| Field | Default | Description |
|---|---|---|
| `error_code` | **Required** | HTTP status from origin that triggers this override (400–599). |
| `response_code` | `null` | HTTP status sent to the viewer. |
| `response_page_path` | `null` | Object path returned, e.g. `"/index.html"`. |
| `error_caching_min_ttl` | `0` | Seconds to cache this error response. |

### Geo Restriction

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `geo_restriction` | `object` | `{ restriction_type = "none", locations = [] }` | Country-level access control. |

`geo_restriction` fields:

| Field | Default | Description |
|---|---|---|
| `restriction_type` | `"none"` | `"none"`, `"whitelist"`, or `"blacklist"`. |
| `locations` | `[]` | ISO 3166-1 alpha-2 country codes, e.g. `["ID", "SG"]`. |

### Origin Access Control

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `origin_access_control` | `object` | `{}` (all optional defaults apply) | OAC settings for S3 origins. |

`origin_access_control` fields:

| Field | Default | Description |
|---|---|---|
| `create` | `true` | When `true`, the module creates an OAC. |
| `id` | `null` | Bring-your-own existing OAC ID (skip creation). |
| `name` | auto-generated | Display name for the OAC. |
| `description` | `"Origin access control for CloudFront S3 origins."` | Description stored with the OAC. |
| `signing_behavior` | `"always"` | `"always"`, `"never"`, or `"no-override"`. |
| `signing_protocol` | `"sigv4"` | Must be `"sigv4"` (the only value CloudFront supports). |

### Custom Domains and TLS

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `aliases` | `list(string)` | `[]` | Custom CNAMEs, e.g. `["app.example.com"]`. |
| `acm_certificate_arn` | `string` | **Required** | ACM certificate ARN. **Must be in `us-east-1`.** |
| `ssl_support_method` | `string` | `"sni-only"` | `"sni-only"` (recommended), `"vip"`, or `"static-ip"`. |

This module enforces a fixed viewer TLS policy of `TLSv1.2_2021`.

### Content and Security

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `price_class` | `string` | `"PriceClass_100"` | Edge location coverage and cost tier. |
| `default_root_object` | `string` | `"index.html"` | Object served at the root URL `/`. |
| `web_acl_id` | `string` | `null` | Optional AWS WAF Web ACL ARN to attach. |

### Logging

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `enable_logging` | `bool` | `false` | Enable CloudFront standard access logging. |
| `log_bucket_domain_name` | `string` | `null` | S3 bucket domain for logs. Required when `enable_logging = true`. |
| `log_include_cookies` | `bool` | `false` | Include cookie values in access logs. |
| `log_prefix` | `string` | `"cloudfront/"` | Prefix (folder path) for log objects in S3. |

### Tagging

| Name | Type | Required / Default | Description |
|---|---|---|---|
| `tags` | `map(string)` | `{}` | Tags applied to all taggable resources. |

---

## Output Values

| Name | Description | Example use |
|---|---|---|
| `distribution_id` | CloudFront distribution ID | Cache invalidation API calls |
| `distribution_arn` | Full distribution ARN | Attaching WAF Web ACLs |
| `distribution_domain_name` | `*.cloudfront.net` hostname | Route53 alias target |
| `hosted_zone_id` | Route53 alias hosted zone | Route53 `alias` record `zone_id` |
| `origin_access_control_id` | OAC ID used by S3 origins | Reuse OAC across multiple distributions |
| `distribution_status` | `"InProgress"` or `"Deployed"` | Monitoring pipelines |
| `distribution_etag` | Distribution config ETag | Direct CloudFront API calls |
| `distribution_aliases` | Set of alias hostnames on the distribution | Verification |
| `distribution_comment` | Console display name | Verification |
| `distribution` | Structured object (id, arn, domain_name, …) | Passing full context to other modules |
| `s3_origin_bucket_names` | Map: origin ID → bucket name | Feeding into separate IAM modules |
| `s3_origin_bucket_policy_documents` | Map: bucket name → policy JSON | Audit or manual policy override |

---

## Example Usage

The [example.tf](example.tf) file in this module folder contains a full
commented example.  Here is the minimum-viable usage to get started:

### Minimal — single private S3 origin

```hcl
module "cdn" {
  source = "./modules/cloudfront"

  project_name = "myapp"
  environment  = "prod"

  origins = {
    frontend = {
      origin_type = "s3"
      domain_name = "myapp-prod-frontend.s3.ap-southeast-1.amazonaws.com"
      s3_config = {
        bucket_name          = "myapp-prod-frontend"
        manage_bucket_policy = true
      }
    }
  }

  default_cache_behavior = {
    target_origin_id = "frontend"
  }
}
```

After `terraform apply`, access the site at:
```
https://<module.cdn.distribution_domain_name>
```

### With custom domain

```hcl
module "cdn" {
  source = "./modules/cloudfront"

  project_name        = "myapp"
  environment         = "prod"
  aliases             = ["app.example.com"]
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456:certificate/abc-123"

  origins = {
    frontend = {
      origin_type = "s3"
      domain_name = "myapp-prod.s3.ap-southeast-1.amazonaws.com"
      s3_config   = { bucket_name = "myapp-prod" }
    }
  }

  default_cache_behavior = { target_origin_id = "frontend" }
}

# Point your domain at CloudFront
resource "aws_route53_record" "www" {
  zone_id = var.hosted_zone_id
  name    = "app.example.com"
  type    = "A"

  alias {
    name                   = module.cdn.distribution_domain_name
    zone_id                = module.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}
```

See [example.tf](example.tf) for a full production example with S3 + API
origins, ordered cache behaviors, SPA error responses, and logging.

---

## How It Works — Step by Step

Understanding the internal execution order helps when debugging.

**1. Terraform reads variables**
   Terraform validates the inputs against the `type` and `validation` blocks in
   `variables.tf` before contacting AWS at all.  If any validation fails, you
   see a friendly error message and no AWS resources are touched.

**2. Locals are computed (`locals {}` in `main.tf`)**
   The module derives several helper values:
   - `distribution_name` — combines `project_name` + `environment` if not overridden.
   - `has_s3_origins` — `true` if at least one origin is type `"s3"`.
   - `create_origin_access_control` — `true` if OAC creation is needed.
   - `origin_access_control_id` — the ID to use (created or provided).
   - `s3_origins` — filtered map containing only S3-type origins.
   - `s3_origin_bucket_names` — resolved bucket names per origin.
   - `managed_s3_origin_bucket_policies` — map of buckets that need policy management.

**3. OAC is created (if needed)**
   `aws_cloudfront_origin_access_control.this` is created using Terraform `count`.
   `count = local.create_origin_access_control ? 1 : 0` means it's created
   only when the module determines an OAC is needed.

**4. IAM policy documents are rendered**
   `data.aws_iam_policy_document.s3_origin_bucket_policy` computes (renders)
   the JSON for each managed S3 bucket.  Each policy has two statements:
   - **Allow** — permits CloudFront (identified by the OAC) to call `s3:GetObject`.
   - **Deny** — blocks any request that is not using HTTPS/SigV4 (TLS enforcement).

**5. Distribution is created**
   `aws_cloudfront_distribution.this` is the main resource.
   Inside it, `dynamic` blocks loop over the input variables to generate
   multiple origin blocks, behavior blocks, and error response blocks from
   a single resource declaration.

**6. Bucket policies are attached**
   `aws_s3_bucket_policy.origin` iterates (via `for_each`) over the
   `managed_s3_origin_bucket_policies` map and attaches the rendered policy
   JSON to each bucket.

**7. Outputs are exported**
   `outputs.tf` reads attributes from the created resources and makes them
   available to the module caller.

---

## Understanding Key Terraform Concepts

This module uses several intermediate and advanced Terraform patterns.
Here is a plain-language explanation of each.

### `for_each` — create multiple resources from a map

```hcl
resource "aws_s3_bucket_policy" "origin" {
  for_each = local.managed_s3_origin_bucket_policies
  bucket   = each.key
  policy   = each.value
}
```

`for_each` tells Terraform to create one instance of this resource for every
key-value pair in the map.  Each instance is identified by `each.key` and
can read its value with `each.value`.  If you add an origin, a new bucket
policy is created; if you remove one, only that policy is destroyed.

### `dynamic` blocks — conditionally include nested blocks

```hcl
dynamic "logging_config" {
  for_each = var.enable_logging ? [1] : []
  content {
    bucket = var.log_bucket_domain_name
  }
}
```

A `dynamic` block with `for_each = [1]` is included once in the output.
A `dynamic` block with `for_each = []` is omitted entirely.
This is how Terraform conditionally includes optional nested configuration
blocks (like `logging_config`) that cannot simply be `null`.

### `locals` — intermediate computed values

```hcl
locals {
  has_s3_origins = anytrue([
    for origin in values(var.origins) : origin.origin_type == "s3"
  ])
}
```

`locals` gives names to expressions that would otherwise be long and
repeated.  They are computed once and can be referenced anywhere in `main.tf`.

### `count` — create zero or one resource conditionally

```hcl
resource "aws_cloudfront_origin_access_control" "this" {
  count = local.create_origin_access_control ? 1 : 0
  ...
}
```

`count = 1` creates the resource.  `count = 0` means it is not created.
Access the (possibly absent) resource with `aws_cloudfront_origin_access_control.this[0]`.

### `coalesce` — return the first non-null value

```hcl
coalesce(var.comment, local.distribution_name)
```

Returns `var.comment` if it is not null/empty, otherwise falls back to
`local.distribution_name`.  A clean way to implement "use the override if
provided, otherwise use the default."

### `try` — suppress errors when a value might not exist

```hcl
try(origin.custom_origin_config.origin_protocol_policy, "https-only")
```

If `origin.custom_origin_config` is `null` (S3 origin), evaluating `.origin_protocol_policy`
would cause an error.  `try()` catches that error and returns the fallback
`"https-only"` instead.

### `optional()` in object types

```hcl
type = object({
  bucket_name          = optional(string)
  manage_bucket_policy = optional(bool, true)
})
```

`optional(type)` makes a field optional with a default of `null`.
`optional(type, default)` makes it optional with an explicit default value.
Without `optional()`, callers would have to set every field even if they
don't use it.

### IAM policy data sources

```hcl
data "aws_iam_policy_document" "s3_origin_bucket_policy" {
  for_each = local.managed_s3_origin_bucket_policies
  ...
}
```

`data` sources read from AWS or compute a value — they do not create
resources.  `aws_iam_policy_document` generates correctly formatted IAM JSON.
Using it is safer than writing JSON strings manually because Terraform
validates the syntax.

---

## Common Issues and Troubleshooting

### `Error: InvalidViewerCertificate - The specified SSL certificate doesn't exist`

**Cause:** The ACM certificate is in the wrong region.  
**Fix:** CloudFront only accepts ACM certificates from `us-east-1`.  Create
or re-issue the certificate there, then update `acm_certificate_arn`.

---

### `403 Forbidden` after deployment

**Possible causes:**
1. The S3 bucket policy was not applied (e.g. `manage_bucket_policy = false`
   but no external policy exists).  
   **Fix:** Set `manage_bucket_policy = true`, or manually add the policy from
   the `s3_origin_bucket_policy_documents` output.
2. Public access is blocked at the S3 account or bucket level and CloudFront
   is not using OAC.  
   **Fix:** Ensure `origin_access_control.create = true` and OAC ID appears
   in the distribution.

---

### SPA routes return an XML S3 error page instead of the app

**Cause:** S3 returns a `403` or `404` when a URL like `/dashboard` does not
match an object.  
**Fix:** Add custom error responses that map both `403` and `404` to a
`200` response with `/index.html`.

```hcl
custom_error_responses = [
  { error_code = 403, response_code = 200, response_page_path = "/index.html" },
  { error_code = 404, response_code = 200, response_page_path = "/index.html" },
]
```

---

### Distribution is stuck in `InProgress` state for a long time

**Cause:** CloudFront propagation to all edge locations takes 5–15 minutes.
This is normal.  
**Fix:** Wait.  If `wait_for_deployment = true` (the default) the apply
command will also wait.  Set `wait_for_deployment = false` to let `apply`
complete immediately (but the distribution may not fully serve traffic yet).

---

### `Error: cached_methods must be a subset of allowed_methods`

**Cause:** The `cached_methods` list includes a method that is not in
`allowed_methods`.  
**Fix:** Ensure every method in `cached_methods` is also in `allowed_methods`.

---

### Changes to the distribution take effect slowly

**Cause:** CloudFront caches content at edge locations.  Updating a file in
S3 does not automatically purge the cache.  
**Fix:** Create a **cache invalidation** on the distribution:
```
aws cloudfront create-invalidation \
  --distribution-id <distribution_id> \
  --paths "/*"
```
Or use a versioned URL strategy (e.g. `main.abc123.js`) so new deploys
automatically break the cache.

---

## Best Practices

| Practice | Why |
|---|---|
| Always use `origin_type = "s3"` with OAC | OAI (the predecessor) is deprecated and does not support all S3 features |
| Set `minimum_protocol_version = "TLSv1.2_2021"` | Blocks TLS 1.0 and 1.1 which have known vulnerabilities |
| Leave `compress = true` | Reduces transfer costs and improves load times with no downside |
| Keep `wait_for_deployment = true` in pipelines | Ensures downstream steps run only after CloudFront is fully deployed |
| Set `retain_on_delete = true` in production | Prevents accidental CDN outages during `terraform destroy` |
| Use managed cache policies instead of legacy TTL fields | AWS updates managed policies; custom TTL fields are deprecated in new distributions |
| Use `PriceClass_All` only for global audiences | `PriceClass_100` is 30–50% cheaper and covers North America + Europe |
| Tag every resource | Required for cost attribution, security audits, and access control by tag |
| Store the ACM certificate in `us-east-1` | CloudFront is a global service and only reads certs from that one region |