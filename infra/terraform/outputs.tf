output "state_bucket_name" {
  description = "Terraform remote state S3 bucket name."
  value       = module.s3_state_backend.bucket_name
}

output "state_backend_path" {
  description = "Terraform state backend path in bucket/prefix format."
  value       = "${module.s3_state_backend.bucket_name}/${var.project_name}/${var.environment}"
}

output "state_bucket_arn" {
  description = "Terraform remote state S3 bucket ARN."
  value       = module.s3_state_backend.bucket_arn
}

output "lock_table_name" {
  description = "Terraform lock table name."
  value       = module.dynamodb_lock_table.table_name
}

output "lock_table_arn" {
  description = "Terraform lock table ARN."
  value       = module.dynamodb_lock_table.table_arn
}

# output "iam_role_arns" {
#   description = "IAM role ARNs created for bootstrap foundation."
#   value       = module.iam_bootstrap_roles.iam_role_arns
# }

output "lambda_log_group_names" {
  description = "Lambda log groups created by this bootstrap."
  value       = module.cloudwatch_logging.lambda_log_group_names
}

output "api_gateway_log_group_names" {
  description = "API Gateway log groups created by this bootstrap."
  value       = module.cloudwatch_logging.api_gateway_log_group_names
}

output "budget_name" {
  description = "Monthly AWS budget resource name."
  value       = module.budget_alert.budget_name
}
