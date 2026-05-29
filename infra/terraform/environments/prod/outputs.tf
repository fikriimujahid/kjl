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

output "catalog_public_bucket_name" {
  description = "S3 bucket name for the product catalog in the dev environment."
  value       = module.catalog_public_bucket.bucket_name
}

output "media_private_bucket_name" {
  description = "S3 bucket name for private product media in the dev environment."
  value       = module.media_private_bucket.bucket_name
}

output "media_private_bucket_arn" {
  description = "S3 bucket ARN for private product media in the dev environment."
  value       = module.media_private_bucket.bucket_arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for the frontend site in the dev environment."
  value       = module.frontend_site_hosting.distribution_id
}

# -------------------------------------------------------------------------
# SERVICE API
# -------------------------------------------------------------------------
output "service_api_endpoint" {
  description = "API Gateway endpoint for the service API in the dev environment."
  value       = module.service_api.api_endpoint
}

output "auth_api_lambda_function_name" {
  description = "Lambda function name backing the Auth API in the dev environment."
  value       = module.service_api.lambda_function_names["auth"]
}

output "product_api_lambda_function_name" {
  description = "Lambda function name backing the Product API in the dev environment."
  value       = module.service_api.lambda_function_names["product"]
}

output "payment_api_lambda_function_name" {
  description = "Lambda function name backing payment routes in the dev environment."
  value       = module.service_api.lambda_function_names["payment"]
}

output "learning_api_lambda_function_name" {
  description = "Lambda function name backing learning routes in the dev environment."
  value       = module.service_api.lambda_function_names["learning"]
}

# -------------------------------------------------------------------------
# DYNAMODB TABLE
# -------------------------------------------------------------------------
output "progress_table_name" {
  description = "DynamoDB progress table name in the dev environment."
  value       = module.progress_table.table_name
}

output "products_table_name" {
  description = "DynamoDB products table name in the dev environment."
  value       = module.products_table.table_name
}

output "payments_table_name" {
  description = "DynamoDB payments table name in the dev environment."
  value       = module.payments_table.table_name
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