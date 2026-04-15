output "bucket_name" {
  description = "Terraform state bucket name."
  value       = var.bucket_name
}

output "bucket_arn" {
  description = "Terraform state bucket ARN."
  value       = var.create_bucket ? aws_s3_bucket.this[0].arn : data.aws_s3_bucket.existing[0].arn
}
