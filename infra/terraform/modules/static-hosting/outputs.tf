# =============================================================================
# hosting/outputs.tf
# =============================================================================
# Outputs expose selected values from this module to the calling root module
# (or any other module that uses this one as a source).
#
# WHY ARE OUTPUTS NEEDED?
#   Terraform modules are isolated scopes — internal resources are not visible
#   to the outside. Outputs are the ONLY way to pass data out of a module.
#   Without outputs, a caller could not know the CloudFront domain, S3 bucket
#   names, or any other value created by the child modules.
#
# NULLABILITY PATTERN:
#   Several outputs below use a ternary guard:
#     module.route53.fqdn
#   route53 is currently instantiated as a single module object,
#   so outputs reference module.route53 directly.
# =============================================================================

# =============================================================================
# S3 BUCKET OUTPUTS
# =============================================================================

# Map of every S3 bucket created by this module, keyed by the logical name.
# Example: { "frontend" = "kjl-prod-frontend", "logs" = "kjl-prod-cloudfront-logs" }
# Use this when you need to reference any of the buckets without knowing in
# advance which specific keys exist (e.g., in a for_each loop downstream).
output "bucket_names" {
  description = "Map of logical bucket keys to bucket names created by this module."
  value = {
    frontend = module.s3_static_hosting.bucket_name
    logs     = module.s3_logs.bucket_name
  }
}

# Map of every S3 bucket ARN, keyed by the logical name.
# Example: { "frontend" = "arn:aws:s3:::kjl-prod-frontend" }
# ARNs are required when writing IAM policy statements that grant access
# to a specific bucket (e.g., allowing a Lambda to read website assets).
output "bucket_arns" {
  description = "Map of logical bucket keys to S3 bucket ARNs."
  value = {
    frontend = module.s3_static_hosting.bucket_arn
    logs     = module.s3_logs.bucket_arn
  }
}

# Map of every S3 bucket ID, keyed by the logical name.
# In S3, the bucket ID is the same as the bucket name.
# Some Terraform resources and data sources require an "id" rather than a name.
output "bucket_ids" {
  description = "Map of logical bucket keys to bucket IDs."
  value = {
    frontend = module.s3_static_hosting.bucket_id
    logs     = module.s3_logs.bucket_id
  }
}

# Convenience shortcut to just the frontend bucket name as a plain string.
# Avoids the need to write: module.hosting.bucket_names["frontend"]
output "frontend_bucket_name" {
  description = "Frontend origin bucket name."
  value       = module.s3_static_hosting.bucket_name
}

# Convenience shortcut to just the log bucket name as a plain string.
# try() safely returns null when logging was disabled and no log bucket exists.
output "log_bucket_name" {
  description = "CloudFront log bucket name when logging is enabled."
  value       = module.s3_logs.bucket_name
}

# Full structured metadata object for the frontend S3 bucket.
# Contains: name, ARN, region, domain_name, regional_domain_name, etc.
# Use this when a downstream module needs several bucket attributes at once
# instead of referencing individual outputs one at a time.
output "frontend_bucket" {
  description = "Structured metadata for the frontend S3 bucket."
  value       = module.s3_static_hosting.bucket
}

# Full structured metadata for the CloudFront log bucket.
# Returns null when logging is disabled (var.buckets.logging.enabled = false),
# so callers can use try(module.hosting.logging_bucket.name, null) safely.
output "logging_bucket" {
  description = "Structured metadata for the CloudFront logging bucket when enabled."
  value       = module.s3_logs.bucket
}

# =============================================================================
# DNS OUTPUT
# =============================================================================

# The primary fully qualified domain name (FQDN) of the website.
# Example: "learn.example.com"
#
# This is the URL your users should bookmark. It comes from the Route53 record
# identified by local.primary_dns_record_key.
#
# Returns null when var.create_dns_records = false, because no Route53 record
# was created inside this module and the fqdn is not known here.
# (The caller is responsible for DNS in that case.)
output "fqdn" {
  description = "Primary fully qualified DNS name created in Route53, or null when Route53 record creation is disabled."
  value       = module.route53.fqdn
}

# =============================================================================
# CLOUDFRONT OUTPUTS
# =============================================================================

# The auto-assigned CloudFront domain name. Always present, regardless of
# whether a custom domain is configured.
# Example: "d1234abcd.cloudfront.net"
# You can use this URL immediately to test the distribution without DNS setup.
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name."
  value       = module.cloudfront.distribution_domain_name
}

# The unique AWS-assigned distribution ID.
# You need this ID to invalidate the cache after a deployment:
#   aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
output "distribution_id" {
  description = "CloudFront distribution ID."
  value       = module.cloudfront.distribution_id
}

# The ARN of the CloudFront distribution.
# Required when:
#   - Attaching an AWS WAF Web ACL to the distribution
#   - Creating CloudWatch alarms specific to this distribution
#   - Writing IAM policies that reference this distribution
output "distribution_arn" {
  description = "CloudFront distribution ARN."
  value       = module.cloudfront.distribution_arn
}

# Full structured metadata object for the CloudFront distribution.
# Contains all distribution attributes returned by the cloudfront child module.
# Use this when a downstream module needs multiple CloudFront properties at once.
output "cloudfront_distribution" {
  description = "Structured CloudFront distribution metadata for downstream modules."
  value       = module.cloudfront.distribution
}

# List of custom domain aliases attached to the distribution.
# Should match local.distribution_aliases (domain_name + SANs unless overridden).
# Useful for verifying which domains are active on the distribution.
output "cloudfront_aliases" {
  description = "Aliases configured on the CloudFront distribution."
  value       = module.cloudfront.distribution_aliases
}

# The Origin Access Control (OAC) ID attached to S3 origins.
# OAC is CloudFront's mechanism for securely reading from private S3 buckets.
# Useful for debugging 403 Access Denied errors from S3:
#   → Check that this OAC ID is referenced in the S3 bucket policy.
output "origin_access_control_id" {
  description = "Origin access control ID attached to S3 origins."
  value       = module.cloudfront.origin_access_control_id
}

# =============================================================================
# ACM CERTIFICATE OUTPUTS
# =============================================================================

# The ARN of the ACM certificate attached to the CloudFront distribution.
# Provide this ARN when you need to attach the same certificate to other
# services (e.g., an API Gateway custom domain or an Application Load Balancer).
output "certificate_arn" {
  description = "ARN of the ACM certificate used by CloudFront."
  value       = module.acm.certificate_arn
}

# Structured ACM certificate metadata collected into one convenient object.
# Fields:
#   arn                       — the certificate ARN
#   domain_name               — the primary domain (Common Name)
#   status                    — "ISSUED", "PENDING_VALIDATION", etc.
#   subject_alternative_names — all additional domain names on the cert
#   validation_record_fqdns   — the DNS CNAME records used for validation
output "certificate" {
  description = "Structured ACM certificate metadata."
  value = {
    arn                       = module.acm.certificate_arn
    domain_name               = module.acm.certificate_domain_name
    status                    = module.acm.certificate_status
    subject_alternative_names = module.acm.subject_alternative_names
    validation_record_fqdns   = module.acm.validation_record_fqdns
  }
}

# List of CNAME FQDNs created in Route53 to prove domain ownership to ACM.
# Example: ["_abc123.learn.example.com."]
# IMPORTANT: These records must remain in DNS indefinitely. ACM reads them
# each time it auto-renews the certificate (every ~13 months).
output "validation_record_fqdns" {
  description = "FQDNs used for ACM DNS validation."
  value       = module.acm.validation_record_fqdns
}

# =============================================================================
# ROUTE53 DNS RECORD OUTPUTS
# =============================================================================

# Map of Route53 record IDs keyed by your logical record key.
# Example: { "apex_ipv4" = "Z1234|learn.example.com|A" }
# Returns an empty map {} when var.create_dns_records = false (no records created).
output "dns_record_ids" {
  description = "Map of Route53 record IDs keyed by dns_records logical key, or an empty map when Route53 record creation is disabled."
  value       = module.route53.record_ids
}

# Map of Route53 record FQDNs keyed by your logical record key.
# Example: { "apex_ipv4" = "learn.example.com", "apex_ipv6" = "learn.example.com" }
# Returns an empty map {} when var.create_dns_records = false.
# The fqdn output above gives you the single "primary" record; this output
# gives you all records for multi-record setups (apex + www, A + AAAA, etc.).
output "dns_record_fqdns" {
  description = "Map of Route53 record FQDNs keyed by dns_records logical key, or an empty map when Route53 record creation is disabled."
  value       = module.route53.record_fqdns
}

output "dns_record_details" {
  description = "Structured Route53 record metadata keyed by dns_records logical key, or an empty map when Route53 record creation is disabled."
  value       = module.route53.record_details
}