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

data "aws_region" "current" {}

output "region" {
  description = "AWS region where Cognito resources are deployed."
  value       = data.aws_region.current.region
}

output "cognito_api_endpoint" {
  description = "Cognito Identity Provider API endpoint base URL."
  value       = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/"
}

output "cognito_uri" {
  description = "Cognito API issuer URI for JWT/OIDC validation."
  value       = "https://cognito-idp.${data.aws_region.current.region}.amazonaws.com/${aws_cognito_user_pool.this.id}"
}

output "user_pool_endpoint" {
  description = "User pool endpoint used by Cognito API calls."
  value       = aws_cognito_user_pool.this.endpoint
}
