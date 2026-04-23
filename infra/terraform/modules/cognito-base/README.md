# Cognito Base Module

## Purpose

This module provisions the core AWS Cognito building blocks required for API-based authentication with a custom frontend UI:

- Cognito User Pool for user identities
- Cognito User Pool Client for API and OAuth sign-in flows
- Cognito User Pool Domain for OAuth redirect endpoints

The module is reusable across environments by parameterizing project and environment values.

## Resources Created

- `aws_cognito_user_pool.this`
- `aws_cognito_user_pool_client.this`
- `aws_cognito_user_pool_domain.this`

## Example Usage

```hcl
module "cognito_base" {
  source = "../../modules/cognito-base"

  project_name = "myapp"
  environment  = "dev"

  callback_urls = [
    "https://dev.myapp.com/auth/callback"
  ]

  logout_urls = [
    "https://dev.myapp.com/logout"
  ]
}
```

## Variables

- `project_name` (string): Project name prefix used for resource naming.
- `environment` (string): Environment name (for example dev, staging, prod).
- `callback_urls` (list(string)): OAuth callback URLs.
- `logout_urls` (list(string)): OAuth logout redirect URLs.
- `supported_identity_providers` (list(string)): Identity providers enabled on the client. Defaults to `COGNITO`.

## Outputs

- `user_pool_id`: Cognito User Pool ID.
- `user_pool_arn`: Cognito User Pool ARN.
- `user_pool_client_id`: Cognito User Pool Client ID.
- `cognito_domain`: Cognito domain prefix.
- `user_pool_endpoint`: Cognito User Pool API endpoint.
