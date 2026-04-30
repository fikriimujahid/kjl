locals {
  enabled_identity_providers = distinct(var.enabled_identity_providers)
  google_enabled             = contains(local.enabled_identity_providers, "Google")
}

module "base" {
  source = "../cognito-base"

  project_name = var.project_name
  environment  = var.environment

  callback_urls                 = var.callback_urls
  logout_urls                   = var.logout_urls
  verification_message_template = var.verification_message_template
}

resource "aws_cognito_identity_provider" "google" {
  count = local.google_enabled ? 1 : 0

  # Adds Google as an external identity provider to the shared user pool.
  user_pool_id  = module.base.user_pool_id
  provider_name = "Google"
  provider_type = "Google"

  # Google OAuth credentials and scopes used by Cognito federation.
  provider_details = {
    client_id        = var.google_client_id
    client_secret    = var.google_client_secret
    authorize_scopes = "email profile openid"
  }

  # Maps Google claims to Cognito standard user attributes.
  attribute_mapping = {
    email = "email"
    name  = "name"
  }
}

resource "aws_cognito_user_pool_client" "api_google" {
  # Dedicated API client that supports both native Cognito and Google sign-in.
  name         = "${var.project_name}-${var.environment}-api-client"
  user_pool_id = module.base.user_pool_id

  # Keep client public for custom frontend usage.
  generate_secret = false

  # Enable Cognito API auth flows for direct email/password login.
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Add Google after its IdP exists to ensure stable apply ordering.
  supported_identity_providers = local.enabled_identity_providers

  # OAuth code flow for social login and secure token exchange.
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  prevent_user_existence_errors = "ENABLED"

  depends_on = [aws_cognito_identity_provider.google]
}
