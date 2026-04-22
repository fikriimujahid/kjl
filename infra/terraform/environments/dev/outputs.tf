output "region" {
  description = "AWS region used by Cognito in the dev environment."
  value       = module.cognito.region
}

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
