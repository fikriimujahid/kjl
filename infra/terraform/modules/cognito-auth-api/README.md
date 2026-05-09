# Cognito Auth API Module

## Purpose

This module extends the base Cognito module to provide API-ready authentication with both:

- Email/password login (Cognito native)
- Google login (federation)

It keeps core Cognito infrastructure reusable while adding social federation in a dedicated wrapper module.

## How Google Federation Works

1. The module creates core Cognito resources through `cognito-base`.
2. It adds `aws_cognito_identity_provider` for Google.
3. It creates a Google-enabled Cognito app client supporting:
   - `COGNITO`
   - `Google`

Your custom frontend can then use Cognito OAuth code flow and Cognito API auth endpoints.

## Required Google OAuth Redirect URL

In Google Cloud Console, configure this authorized redirect URI:

```text
https://<your-cognito-domain>.auth.<region>.amazoncognito.com/oauth2/idpresponse
```

Example:

```text
https://myapp-dev.auth.ap-southeast-1.amazoncognito.com/oauth2/idpresponse
```

## Google Console Configuration Checklist

1. Create an OAuth 2.0 Client ID (Web application).
2. Add the Cognito redirect URI above to Authorized redirect URIs.
3. Copy the generated Client ID and Client Secret.
4. Pass them into this module using `google_client_id` and `google_client_secret`.

## Example Usage from Environment Root Module

```hcl
module "cognito" {
  source = "../../modules/cognito-auth-api"

  project_name = "myapp"
  environment  = "dev"

  callback_urls = [
    "https://dev.myapp.com/auth/callback"
  ]

  logout_urls = [
    "https://dev.myapp.com/logout"
  ]

  token_validity = {
    access_token_validity  = 30
    id_token_validity      = 30
    refresh_token_validity = 30
    token_validity_units = {
      access_token  = "minutes"
      id_token      = "minutes"
      refresh_token = "days"
    }
  }

  google_client_id     = var.google_client_id
  google_client_secret = var.google_client_secret
}
```

## Variables

- `project_name` (string): Project name prefix.
- `environment` (string): Environment name.
- `callback_urls` (list(string)): OAuth callback URLs.
- `logout_urls` (list(string)): OAuth logout URLs.
- `token_validity` (object): Optional token lifetime settings for access, ID, and refresh tokens.
- `google_client_id` (string): Google OAuth client ID.
- `google_client_secret` (string, sensitive): Google OAuth client secret.

## Outputs

- `user_pool_id`: Cognito User Pool ID.
- `user_pool_client_id`: Google-enabled Cognito User Pool Client ID.
- `cognito_domain`: Cognito domain prefix.
- `user_pool_arn`: Cognito User Pool ARN.
