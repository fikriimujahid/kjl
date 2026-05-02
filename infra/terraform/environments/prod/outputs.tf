output "region" {
  description = "AWS region used by Cognito in the dev environment."
  value       = module.cognito.region
}

# -------------------------------------------------------------------------
# FRONTEND SITE HOSTING
# -------------------------------------------------------------------------
output "frontend_site_hosting_bucket_name" {
  description = "S3 bucket name for frontend static hosting in the dev environment."
  value       = module.frontend_site_hosting.frontend_bucket_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the frontend site in the dev environment."
  value       = module.frontend_site_hosting.distribution_id
}

# -------------------------------------------------------------------------
# PAYMENT API
# -------------------------------------------------------------------------
output "payment_api_endpoint" {
  description = "Shared API Gateway endpoint (products + payments) in the prod environment."
  value       = module.service_api.api_endpoint
}

output "payment_api_lambda_function_name" {
  description = "Lambda function name backing payment routes in the prod environment."
  value       = module.service_api.lambda_function_names["payment"]
}

# -------------------------------------------------------------------------
# DYNAMODB LEARNING CONTENT TABLE
# -------------------------------------------------------------------------
output "learning_content_table_name" {
  description = "DynamoDB learning content table name in the prod environment."
  value       = module.learning_content_table.table_name
}

output "learning_content_table_arn" {
  description = "DynamoDB learning content table ARN in the prod environment."
  value       = module.learning_content_table.table_arn
}

output "learning_content_table_id" {
  description = "DynamoDB learning content table ID in the prod environment."
  value       = module.learning_content_table.table_id
}

# -------------------------------------------------------------------------
# COGNITO AUTH
# -------------------------------------------------------------------------
output "user_pool_id" {
  description = "Cognito User Pool ID for the dev environment."
  value       = module.cognito.user_pool_id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID for the dev environment."
  value       = module.cognito.user_pool_client_id
}

output "cognito_api_endpoint" {
  description = "Cognito Identity Provider API endpoint base URL for the dev environment."
  value       = module.cognito.cognito_api_endpoint
}

# -------------------------------------------------------------------------
# GITHUB CICD
# -------------------------------------------------------------------------
output "github_runner_role_arn" {
  description = "ARN of the IAM role for GitHub Actions CI/CD runner in the dev environment."
  value       = module.github_cicd.role_arn
}

output "github_runner_role_name" {
  description = "Name of the IAM role for GitHub Actions CI/CD runner in the dev environment."
  value       = module.github_cicd.role_name
}