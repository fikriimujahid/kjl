locals {
  name_prefix = "${var.project_name}-${var.environment}"
  tags = {
    Project     = var.project_name
    Environment = var.environment
  }
}

resource "aws_cognito_user_pool" "this" {
  # Core identity store used by API authentication and federation providers.
  name = "${local.name_prefix}-user-pool"

  # Users authenticate with email, and Cognito verifies the email automatically.
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Require email as a standard attribute for every user profile.
  schema {
    name                = "email"
    attribute_data_type = "String"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 5
      max_length = 2048
    }
  }

  # Enforce baseline password strength for email/password authentication.
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = false
  }

  tags = local.tags
}

resource "aws_cognito_user_pool_client" "this" {
  # App client used by custom frontend and backend APIs for Cognito auth flows.
  name         = "${local.name_prefix}-app-client"
  user_pool_id = aws_cognito_user_pool.this.id

  # Public clients (SPA/mobile/custom UI) should not rely on a client secret.
  generate_secret = false

  # Enable API-based auth flows for username/password, SRP, and refresh tokens.
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Allows extension modules to add social providers while keeping COGNITO default.
  supported_identity_providers = var.supported_identity_providers

  # Enable OAuth 2.0 authorization code flow for federation integrations.
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls

  # Hides user existence details from authentication error responses.
  prevent_user_existence_errors = "ENABLED"
}

resource "aws_cognito_user_pool_domain" "this" {
  # Cognito domain is required for OAuth redirect endpoints.
  domain       = "${var.project_name}-${var.environment}"
  user_pool_id = aws_cognito_user_pool.this.id
}
