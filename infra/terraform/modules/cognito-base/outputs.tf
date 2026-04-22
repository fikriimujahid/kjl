output "user_pool_id" {
  description = "ID of the Cognito user pool."
  value       = aws_cognito_user_pool.this.id
}

output "user_pool_arn" {
  description = "ARN of the Cognito user pool."
  value       = aws_cognito_user_pool.this.arn
}

output "user_pool_client_id" {
  description = "ID of the Cognito app client used for API authentication."
  value       = aws_cognito_user_pool_client.this.id
}

output "cognito_domain" {
  description = "Cognito domain prefix attached to the user pool."
  value       = aws_cognito_user_pool_domain.this.domain
}

output "user_pool_endpoint" {
  description = "User pool endpoint used by Cognito API calls."
  value       = aws_cognito_user_pool.this.endpoint
}
