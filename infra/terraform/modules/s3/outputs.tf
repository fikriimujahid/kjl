# ---------------------------------------------------------------------------
# outputs.tf
#
# Exposes useful values from the module so that other modules and the root
# configuration can reference the resources created here.
#
# Outputs are the module's public API.  They are the only values visible to
# callers.  All other locals and intermediate computed values are private.
#
# Naming convention:
#   • Lists are named in the plural (bucket_names).
#   • Maps keyed by the input bucket key include "_by_key" or are named to
#     imply a map (bucket_ids, bucket_arns).
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# bucket_names
# ---------------------------------------------------------------------------
# A sorted list of all bucket names created by this module.
# Useful when you need a flat list, e.g. to pass to an IAM policy that
# grants access to all buckets managed by the module.
#
# sort() ensures the order is stable across Terraform runs, making plans
# easier to read (AWS returns maps in non-deterministic order).
output "bucket_names" {
  description = "Names of all buckets created by this module."
  value       = sort([for bucket in values(aws_s3_bucket.this) : bucket.bucket])
}


# ---------------------------------------------------------------------------
# bucket_names_by_key
# ---------------------------------------------------------------------------
# A map from the logical bucket key (e.g. "content") to the real bucket name
# (e.g. "my-project-prod-content").
# Use this to look up the name of a specific bucket by its logical key.
output "bucket_names_by_key" {
  description = "Map of input bucket keys to bucket names."
  value = {
    for key, bucket in aws_s3_bucket.this :
    key => bucket.bucket
  }
}


# ---------------------------------------------------------------------------
# bucket_ids
# ---------------------------------------------------------------------------
# A map from bucket key to bucket ID.
# For S3, the bucket ID equals the bucket name.  However, referencing .id
# is the Terraform convention (other resource types use IDs that are not
# equal to names, so using .id keeps patterns consistent).
output "bucket_ids" {
  description = "Map of input bucket keys to bucket IDs."
  value = {
    for key, bucket in aws_s3_bucket.this :
    key => bucket.id
  }
}


# ---------------------------------------------------------------------------
# bucket_arns
# ---------------------------------------------------------------------------
# A map from bucket key to the bucket's Amazon Resource Name (ARN).
# ARNs are required in IAM policy resource fields.
# Example ARN: arn:aws:s3:::my-project-prod-content
output "bucket_arns" {
  description = "Map of bucket names to ARNs."
  value = {
    for k, v in aws_s3_bucket.this :
    k => v.arn
  }
}


# ---------------------------------------------------------------------------
# bucket_domain_names
# ---------------------------------------------------------------------------
# Global domain names for the buckets.
# Format: <bucket-name>.s3.amazonaws.com
# Used for legacy path-style access or when a globally-addressable endpoint
# is needed.  Most modern setups should prefer bucket_regional_domain_names.
output "bucket_domain_names" {
  description = "Map of bucket names to bucket domain names."
  value = {
    for k, v in aws_s3_bucket.this :
    k => v.bucket_domain_name
  }
}


# ---------------------------------------------------------------------------
# bucket_regional_domain_names
# ---------------------------------------------------------------------------
# Region-specific domain names for the buckets.
# Format: <bucket-name>.s3.<region>.amazonaws.com
# Use this as the CloudFront origin domain name when setting up a
# CloudFront distribution backed by S3.  Regional endpoints are required
# for CloudFront Origin Access Control (OAC) to work correctly.
output "bucket_regional_domain_names" {
  description = "Map of input bucket keys to regional domain names."
  value = {
    for key, bucket in aws_s3_bucket.this :
    key => bucket.bucket_regional_domain_name
  }
}


# ---------------------------------------------------------------------------
# bucket_hosted_zone_ids
# ---------------------------------------------------------------------------
# The Route 53 hosted zone ID for each bucket's regional endpoint.
# Needed when creating Route 53 alias records that point a custom domain
# (e.g. cdn.example.com) to an S3 bucket static-website endpoint.
output "bucket_hosted_zone_ids" {
  description = "Map of input bucket keys to Route53 hosted zone IDs."
  value = {
    for key, bucket in aws_s3_bucket.this :
    key => bucket.hosted_zone_id
  }
}


# ---------------------------------------------------------------------------
# iam_policy_arns
# ---------------------------------------------------------------------------
# A map from bucket key to the ARN of the generated read/write IAM policy.
# Only populated for buckets where iam_policy.create = true.
#
# How to use:
#   Attach the policy ARN to an IAM role:
#     aws_iam_role_policy_attachment:<name> {
#       role       = aws_iam_role.app.name
#       policy_arn = module.s3.iam_policy_arns["content"]
#     }
output "iam_policy_arns" {
  description = "Map of bucket names to generated IAM read/write policy ARNs."
  value = {
    for k, v in aws_iam_policy.bucket_rw :
    k => v.arn
  }
}


# ---------------------------------------------------------------------------
# iam_policy_names
# ---------------------------------------------------------------------------
# A map from bucket key to the name of the generated IAM policy.
# Useful for referencing policies by name in CloudFormation, the AWS CLI,
# or other tools that reference IAM policies by name instead of ARN.
output "iam_policy_names" {
  description = "Map of input bucket keys to generated IAM policy names."
  value = {
    for key, policy in aws_iam_policy.bucket_rw :
    key => policy.name
  }
}


# ---------------------------------------------------------------------------
# buckets (structured object)
# ---------------------------------------------------------------------------
# A single comprehensive map containing all key attributes for every bucket.
# Use this when the consuming module needs multiple fields from the same
# bucket and you want to avoid many individual output lookups.
#
# Example usage in a consuming module:
#   module.s3.buckets["content"].arn
#   module.s3.buckets["content"].regional_domain_name
output "buckets" {
  description = "Structured metadata for each bucket keyed by the input bucket key."
  value = {
    for key, bucket in aws_s3_bucket.this :
    key => {
      # The bucket ID (equals bucket name for S3).
      id = bucket.id
      # The human-readable bucket name as it appears in the AWS console.
      name = bucket.bucket
      # Full ARN for use in IAM policy resource fields.
      arn = bucket.arn
      # Global S3 domain name (<name>.s3.amazonaws.com).
      domain_name = bucket.bucket_domain_name
      # Regional domain name — use this for CloudFront OAC origins.
      regional_domain_name = bucket.bucket_regional_domain_name
      # Route 53 hosted zone ID for alias records.
      hosted_zone_id = bucket.hosted_zone_id
    }
  }
}
