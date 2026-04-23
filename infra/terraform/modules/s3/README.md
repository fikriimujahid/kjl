# S3 Module

A reusable Terraform module that creates one or many AWS S3 buckets with secure defaults, lifecycle management, TLS enforcement, and optional per-bucket IAM policies.

---

## Overview

This module accepts a **map of bucket definitions** and creates a fully-configured S3 bucket for each entry.  You control everything through the `buckets` variable — encryption, versioning, lifecycle rules, tagging, and access policies — without writing repetitive Terraform code.

**Secure by default:**
- Every bucket is encrypted at rest (AES-256 or customer-managed KMS).
- Every bucket blocks all public access.
- Every bucket gets a TLS-only policy that denies plain-HTTP requests.
- Versioning is enabled on every bucket.

---

## Requirements

| Tool | Version |
|------|---------|
| Terraform CLI | `>= 1.5.0` |
| AWS Provider | `>= 5.0, < 6.0` |

---

## Resources Created

| Resource | Purpose |
|----------|---------|
| `aws_s3_bucket` | The bucket itself |
| `aws_s3_bucket_server_side_encryption_configuration` | Encryption at rest |
| `aws_s3_bucket_versioning` | Object version history |
| `aws_s3_bucket_public_access_block` | Blocks all public access |
| `aws_s3_bucket_ownership_controls` | Controls object ownership |
| `aws_s3_bucket_policy` | TLS-only + caller-supplied policies |
| `aws_s3_bucket_lifecycle_configuration` | Object expiry and tiering rules |
| `aws_iam_policy` | Per-bucket read/write IAM policy (optional) |

---

## Quick Start

```hcl
module "storage" {
  source = "./modules/s3"

  tags = {
    Project     = "my-project"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }

  buckets = {
    # Map key is used as the bucket name when bucket_name is not set.
    my-project-dev-content = {}
  }
}
```

That single entry creates a bucket named `my-project-dev-content` with:
- AES-256 encryption
- Versioning enabled
- All public access blocked
- TLS-only bucket policy

---

## Input Variables

### Module-level inputs

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `buckets` | `map(object)` | `{}` | One entry per bucket. See the bucket object fields below. |
| `create_iam_policies` | `bool` | `false` | When `true`, create a read/write IAM policy for every bucket unless overridden. |
| `tags` | `map(string)` | `{}` | Base tags applied to all resources. Per-bucket tags are merged on top. |

### Per-bucket fields (`buckets` object)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `bucket_name` | `string` | *(map key)* | Explicit AWS bucket name. Defaults to the map key. |
| `force_destroy` | `bool` | `false` | When `true`, deletes all objects before destroying the bucket. **Dangerous in production.** |
| `ownership` | `string` | `BucketOwnerEnforced` | Object ownership mode. Options: `BucketOwnerEnforced`, `BucketOwnerPreferred`, `ObjectWriter`. |
| `versioning_enabled` | `bool` | `true` | Simple toggle for versioning. Superseded by `versioning.enabled` if set. |
| `versioning.enabled` | `bool` | `true` | Nested form for versioning control. |
| `lifecycle_days` | `number` | `null` | Legacy shortcut — expire all objects after N days. |
| `lifecycle_rules` | `list(object)` | `[]` | Full lifecycle rules. Supersedes `lifecycle_days`. See below. |
| `encryption.sse_algorithm` | `string` | `AES256` | Encryption algorithm: `AES256` or `aws:kms`. |
| `encryption.kms_master_key_id` | `string` | `null` | KMS key ARN. Required when `sse_algorithm = "aws:kms"`. |
| `encryption.bucket_key_enabled` | `bool` | `true` | Reduce KMS API calls by using S3 Bucket Key. Only applies to `aws:kms`. |
| `public_access_block.block_public_acls` | `bool` | `true` | Block new public ACLs. |
| `public_access_block.block_public_policy` | `bool` | `true` | Block public bucket policies. |
| `public_access_block.ignore_public_acls` | `bool` | `true` | Ignore existing public ACLs. |
| `public_access_block.restrict_public_buckets` | `bool` | `true` | Block all public access via any means. |
| `attach_tls_only_policy` | `bool` | `true` | Attach a policy that denies HTTP (non-HTTPS) requests. |
| `policy_documents` | `list(string)` | `[]` | Additional bucket policy JSON strings to merge with the TLS policy. |
| `iam_policy.create` | `bool` | *(from `create_iam_policies`)* | Create a read/write IAM policy for this bucket. |
| `iam_policy.name` | `string` | *(auto-generated)* | Name for the IAM policy. |
| `iam_policy.bucket_actions` | `list(string)` | *see locals.tf* | IAM actions at the bucket level (e.g. `s3:ListBucket`). |
| `iam_policy.object_actions` | `list(string)` | *see locals.tf* | IAM actions at the object level (e.g. `s3:GetObject`). |
| `tags` | `map(string)` | `{}` | Per-bucket tags merged on top of module `var.tags`. |

### lifecycle_rules object fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `id` | `string` | *auto (`rule-01`…)* | Unique rule identifier. |
| `enabled` | `bool` | `true` | Whether the rule is active. |
| `prefix` | `string` | `null` | Key prefix to scope the rule (e.g. `"uploads/"`). |
| `tags` | `map(string)` | `{}` | Tag filter: all listed tags must match the object. |
| `expiration_days` | `number` | `null` | Delete current versions after N days. |
| `noncurrent_version_expiration_days` | `number` | `null` | Delete old versions after N days. |
| `abort_incomplete_multipart_upload_days` | `number` | `null` | Cancel incomplete uploads after N days. |
| `transitions` | `list({days, storage_class})` | `[]` | Move current versions to cheaper storage after N days. |
| `noncurrent_version_transitions` | `list({noncurrent_days, storage_class})` | `[]` | Move old versions to cheaper storage. |

Valid `storage_class` values: `STANDARD_IA`, `ONEZONE_IA`, `INTELLIGENT_TIERING`, `GLACIER_IR`, `GLACIER`, `DEEP_ARCHIVE`.

---

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `bucket_names` | `list(string)` | Sorted list of all bucket names. |
| `bucket_names_by_key` | `map(string)` | Map: logical key → bucket name. |
| `bucket_ids` | `map(string)` | Map: logical key → bucket ID (equals name for S3). |
| `bucket_arns` | `map(string)` | Map: logical key → bucket ARN. |
| `bucket_domain_names` | `map(string)` | Map: logical key → global domain name. |
| `bucket_regional_domain_names` | `map(string)` | Map: logical key → regional domain name. Use for CloudFront OAC. |
| `bucket_hosted_zone_ids` | `map(string)` | Map: logical key → Route 53 hosted zone ID. Use for alias records. |
| `iam_policy_arns` | `map(string)` | Map: logical key → IAM policy ARN. Only populated when IAM policies are created. |
| `iam_policy_names` | `map(string)` | Map: logical key → IAM policy name. |
| `buckets` | `map(object)` | Structured map: key → `{id, name, arn, domain_name, regional_domain_name, hosted_zone_id}`. |

### Referencing outputs

```hcl
# Get the ARN of a specific bucket
module.storage.bucket_arns["content"]

# Get the regional domain name to use as a CloudFront origin
module.storage.bucket_regional_domain_names["content"]

# Attach the generated IAM policy to an IAM role
resource "aws_iam_role_policy_attachment" "app_s3" {
  role       = aws_iam_role.app.name
  policy_arn = module.storage.iam_policy_arns["content"]
}
```

---

## Example Usage

See [example.tf](example.tf) for a complete production-style example.

### Minimal — just a bucket

```hcl
module "storage" {
  source = "./modules/s3"

  buckets = {
    my-project-dev-content = {}
  }
}
```

### With KMS encryption and lifecycle rules

```hcl
module "storage" {
  source = "./modules/s3"

  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }

  buckets = {
    content = {
      bucket_name = "my-project-prod-content"

      encryption = {
        sse_algorithm     = "aws:kms"
        kms_master_key_id = "arn:aws:kms:ap-southeast-1:123456789012:key/abcd-..."
      }

      lifecycle_rules = [
        {
          id              = "tiering"
          expiration_days = 365
          transitions = [
            { days = 30,  storage_class = "STANDARD_IA" },
            { days = 180, storage_class = "GLACIER" }
          ]
          abort_incomplete_multipart_upload_days = 7
        }
      ]

      iam_policy = {
        create = true
      }
    }
  }
}
```

### Static website hosting bucket

Use this pattern when the bucket serves files through **CloudFront with Origin Access Control (OAC)**.  The bucket itself stays fully private — CloudFront fetches objects using the AWS service principal, not a public URL.  Add your OAC bucket policy statement via `policy_documents`.

```hcl
# Generate the CloudFront OAC bucket policy document separately,
# then pass it to the module as a JSON string.
data "aws_iam_policy_document" "cdn_oac" {
  statement {
    sid    = "AllowCloudFrontOAC"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions   = ["s3:GetObject"]
    resources = ["arn:aws:s3:::my-project-prod-website/*"]

    condition {
      test     = "StringEquals"
      variable = "aws:SourceArn"
      # Replace with your CloudFront distribution ARN.
      values   = ["arn:aws:cloudfront::123456789012:distribution/EXAMPLEID"]
    }
  }
}

module "website_storage" {
  source = "./modules/s3"

  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }

  buckets = {
    website = {
      bucket_name = "my-project-prod-website"

      # BucketOwnerEnforced disables ACLs — required when using OAC.
      ownership = "BucketOwnerEnforced"

      # Keep all public access blocked; CloudFront accesses the bucket
      # via the OAC service principal, not via a public URL.
      public_access_block = {
        block_public_acls       = true
        block_public_policy     = true
        ignore_public_acls      = true
        restrict_public_buckets = true
      }

      # The TLS-only policy is still applied on top of the OAC statement.
      attach_tls_only_policy = true

      # Inject the OAC statement as additional policy JSON.
      # The module merges this with the TLS-only statement automatically.
      policy_documents = [data.aws_iam_policy_document.cdn_oac.json]

      # Enable versioning so you can roll back a bad deployment.
      versioning = { enabled = true }

      # Keep the last 5 non-current versions for rollback, then expire them.
      lifecycle_rules = [
        {
          id                                 = "prune-old-versions"
          noncurrent_version_expiration_days = 30
          abort_incomplete_multipart_upload_days = 7
        }
      ]

      tags = {
        Service = "website"
      }
    }
  }
}
```

### Multiple buckets with a shared KMS key

Use this pattern when all buckets in a module call should use the same customer-managed KMS key.  Set the KMS key ARN at the module `tags` level is not possible, so set it on each bucket.  If you manage many buckets, define a local variable to avoid repeating the ARN.

```hcl
locals {
  kms_key_arn = "arn:aws:kms:ap-southeast-1:123456789012:key/abcd-1234-efgh-5678"
}

module "app_storage" {
  source = "./modules/s3"

  # All resources get these base tags; per-bucket tags are merged on top.
  tags = {
    Project     = "my-project"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }

  # Create read/write IAM policies for every bucket in this call.
  create_iam_policies = true

  buckets = {
    # Bucket 1 — user-uploaded content
    content = {
      bucket_name = "my-project-prod-content"

      encryption = {
        sse_algorithm      = "aws:kms"
        kms_master_key_id  = local.kms_key_arn
        bucket_key_enabled = true  # Reduces KMS API costs
      }

      lifecycle_rules = [
        {
          id              = "tiering"
          expiration_days = 730  # 2 years
          transitions = [
            { days = 90,  storage_class = "STANDARD_IA" },
            { days = 365, storage_class = "GLACIER" }
          ]
          abort_incomplete_multipart_upload_days = 7
        }
      ]

      tags = { DataClass = "internal", Service = "content" }
    }

    # Bucket 2 — application access logs
    logs = {
      bucket_name = "my-project-prod-access-logs"

      # Log delivery requires BucketOwnerPreferred so the S3 logging
      # service can write objects and preserve the bucket owner's access.
      ownership = "BucketOwnerPreferred"

      encryption = {
        sse_algorithm      = "aws:kms"
        kms_master_key_id  = local.kms_key_arn
        bucket_key_enabled = true
      }

      lifecycle_rules = [
        {
          id              = "expire-logs"
          expiration_days = 180
          abort_incomplete_multipart_upload_days = 3
        }
      ]

      tags = { DataClass = "audit", Service = "logging" }
    }

    # Bucket 3 — Terraform remote state backups
    tf-state-backup = {
      bucket_name = "my-project-prod-tf-state-backup"

      encryption = {
        sse_algorithm      = "aws:kms"
        kms_master_key_id  = local.kms_key_arn
        bucket_key_enabled = true
      }

      # Never auto-expire state files; keep all versions indefinitely.
      # Prune only non-current versions older than 90 days.
      lifecycle_rules = [
        {
          id                                 = "prune-old-versions"
          noncurrent_version_expiration_days = 90
          abort_incomplete_multipart_upload_days = 7
        }
      ]

      tags = { DataClass = "confidential", Service = "terraform" }
    }
  }
}

# Reference outputs to attach the generated IAM policies to application roles.
resource "aws_iam_role_policy_attachment" "app_content" {
  role       = aws_iam_role.app.name
  policy_arn = module.app_storage.iam_policy_arns["content"]
}
```

---

## How It Works — Step by Step

Understanding this module is easier when you know which file does what:

1. **`versions.tf`** — Terraform reads this first to check the CLI and provider version requirements.

2. **`variables.tf`** — Defines the three public inputs (`buckets`, `create_iam_policies`, `tags`). Also contains 13 validation blocks that check for naming errors, invalid storage class names, missing KMS keys, etc. — all **before** creating any resource.

3. **`locals.tf`** — The normalization hub. Converts the flexible `var.buckets` input into a uniform internal model (`normalized_buckets`) so every other file can work with a consistent structure. Also pre-computes three filtered sub-maps:
   - `buckets_with_lifecycle` — only buckets that have lifecycle rules
   - `buckets_with_policy` — only buckets that need a bucket policy
   - `buckets_with_iam_policy` — only buckets that need an IAM policy

4. **`main.tf`** — Creates the `aws_s3_bucket` resources (one per map entry using `for_each`).

5. **`encryption.tf`** — Attaches an SSE configuration to every bucket. Handles AES-256 and KMS modes.

6. **`versioning.tf`** — Configures versioning on every bucket.

7. **`security.tf`** — Three things: blocks public access, sets ownership controls, and attaches a merged bucket policy (TLS-only + any extra JSON you provide).

8. **`lifecycle.tf`** — Creates `aws_s3_bucket_lifecycle_configuration` for buckets in `buckets_with_lifecycle`. Uses nested `dynamic` blocks to conditionally include expiration, transition, and multipart-upload-abort rules.

9. **`iam.tf`** — Creates `aws_iam_policy` resources for buckets in `buckets_with_iam_policy`. Each policy has two IAM statements: one for bucket-level actions, one for object-level actions.

10. **`outputs.tf`** — Exposes bucket metadata (names, ARNs, domain names, IAM policy ARNs) so consuming modules can reference them.

---

## Key Concepts for Beginners

### `for_each` on a map
Instead of writing one resource block per bucket, `for_each = local.normalized_buckets` tells Terraform to repeat the block once per map entry.  Each iteration gets `each.key` (the logical name) and `each.value` (the bucket settings).

### `dynamic` blocks
A `dynamic` block inside a resource generates zero or more nested configuration blocks at runtime.  In `lifecycle.tf`, there are six nested `dynamic` blocks — they are only included if the relevant field is set.  If you do not set `expiration_days`, the `expiration` block is simply not created.

### `locals` for normalization
`locals.tf` resolves optional fields, merges defaults, and pre-filters maps so that every resource file works with a clean, guaranteed-to-be-complete data structure.  This is the most important pattern to understand in this module.

### IAM: bucket-level vs object-level
S3 IAM actions are split into two groups, each needing a different resource ARN:
- **Bucket actions** (`s3:ListBucket`, etc.) → resource must be `arn:aws:s3:::bucket-name`
- **Object actions** (`s3:GetObject`, etc.) → resource must be `arn:aws:s3:::bucket-name/*`

That is why `iam.tf` always creates two IAM statements.

### Policy merging with `source_policy_documents`
`security.tf` uses the AWS provider's `source_policy_documents` argument to **merge** multiple partial JSON policies into one.  This keeps each concern (TLS enforcement, CloudFront OAC, etc.) in a separate document while producing a single bucket policy.

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `BucketAlreadyOwnedByYou` | A bucket with this name already exists in your account | Use a unique key/name |
| `BucketAlreadyExists` | A bucket with this name exists in another account | S3 names are globally unique; choose a different name |
| `AccessDenied` when attaching policy | Public access block or ownership controls not yet applied | Add `depends_on` in your caller, or re-run `terraform apply` |
| `InvalidLocationConstraint` | Bucket being created in wrong region | Set the `region` attribute on the AWS provider |
| `kms_master_key_id is required` validation error | Set `sse_algorithm = "aws:kms"` without a key ARN | Add `kms_master_key_id` to the `encryption` block |
| `force_destroy = true` destroyed data | `force_destroy` was left true in production | Set `force_destroy = false` for all production buckets |

---

## Best Practices

- Set `force_destroy = false` for every production bucket (the default).
- Enable `versioning` (the default) and pair it with `noncurrent_version_expiration_days` in a lifecycle rule to avoid unbounded version accumulation.
- Use `lifecycle_rules` instead of `lifecycle_days` for all new buckets; `lifecycle_days` is provided only for backward compatibility.
- Set `abort_incomplete_multipart_upload_days = 7` on buckets that receive large file uploads to avoid hidden storage costs.
- Tag every bucket with at least `Project`, `Environment`, and `ManagedBy` for cost attribution.
- Use `iam_policy.create = true` and attach the generated policy to application IAM roles rather than granting `s3:*` on a wildcard resource.
- Never set any `public_access_block` setting to `false` unless you have a specific, documented reason.