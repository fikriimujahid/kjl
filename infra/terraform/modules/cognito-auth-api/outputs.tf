output "user_pool_id" {
  description = "ID of the Cognito user pool from the base module."
  value       = module.base.user_pool_id
}

output "user_pool_client_id" {
  description = "ID of the Google-enabled Cognito user pool client for API authentication."
  value       = aws_cognito_user_pool_client.api_google.id
}

output "cognito_domain" {
  description = "Cognito domain prefix from the base module."
  value       = module.base.cognito_domain
}

output "region" {
  description = "AWS region where Cognito resources are deployed."
  value       = module.base.region
}

output "cognito_api_endpoint" {
  description = "Cognito Identity Provider API endpoint base URL."
  value       = module.base.cognito_api_endpoint
}

output "cognito_uri" {
  description = "Cognito API issuer URI for JWT/OIDC validation."
  value       = module.base.cognito_uri
}

output "user_pool_arn" {
  description = "ARN of the Cognito user pool from the base module."
  value       = module.base.user_pool_arn
}
