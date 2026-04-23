# ---------------------------------------------------------------------------
# outputs.tf
#
# Public outputs for the single-bucket S3 module.
# ---------------------------------------------------------------------------

output "bucket_name" {
  description = "S3 bucket name."
  value       = aws_s3_bucket.this.bucket
}

output "bucket_id" {
  description = "S3 bucket ID (same as name)."
  value       = aws_s3_bucket.this.id
}

output "bucket_arn" {
  description = "S3 bucket ARN."
  value       = aws_s3_bucket.this.arn
}

output "bucket_domain_name" {
  description = "S3 bucket global domain name."
  value       = aws_s3_bucket.this.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "S3 bucket regional domain name."
  value       = aws_s3_bucket.this.bucket_regional_domain_name
}

output "bucket_hosted_zone_id" {
  description = "Route53 hosted zone ID for the bucket endpoint."
  value       = aws_s3_bucket.this.hosted_zone_id
}



output "bucket" {
  description = "Structured metadata for the bucket."
  value = {
    id                   = aws_s3_bucket.this.id
    name                 = aws_s3_bucket.this.bucket
    arn                  = aws_s3_bucket.this.arn
    domain_name          = aws_s3_bucket.this.bucket_domain_name
    regional_domain_name = aws_s3_bucket.this.bucket_regional_domain_name
    hosted_zone_id       = aws_s3_bucket.this.hosted_zone_id
  }
}
