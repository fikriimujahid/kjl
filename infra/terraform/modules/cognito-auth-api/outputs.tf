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

output "user_pool_arn" {
  description = "ARN of the Cognito user pool from the base module."
  value       = module.base.user_pool_arn
}
