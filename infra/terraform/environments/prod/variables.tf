# ============================================================================
# Common Variables
# ============================================================================
variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment."
  type        = string
}

variable "tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
}

# ============================================================================
# Budget Module Variables
# ============================================================================
variable "budget" {
  description = "Budget settings for the project."
  type = object({
    budget_name            = string
    monthly_budget_limit   = number
    budget_alert_threshold = number
    budget_alert_email     = string
  })
}

# -------------------------------------------------------------------------
# FRONTEND SITE HOSTING MODULE
# -------------------------------------------------------------------------
variable "frontend_site_hosting" {
  description = "CloudFront distribution settings exposed by the hosting wrapper."
  type = object({
    zone_id = string
    # S3 STATIC HOSTING BUCKETS
    s3_static_hosting = object({
      bucket_name = string
    })

    # S3 CLOUDFRONT LOG
    s3_cloudfront_log = object({
      bucket_name    = string
      lifecycle_days = optional(number)
      lifecycle_rules = optional(list(object({
        id      = string
        enabled = bool
        prefix  = optional(string)
        expiration = object({
          days = optional(number)
        })
      })), [])
    })

    acm = object({
      domain_name               = optional(string)
      subject_alternative_names = optional(list(string), [])
      existing_certificate_arn  = optional(string)
    })

    cloudfront = object({
      aliases = list(string)
      custom_error_responses = optional(list(object({
        error_code            = number
        response_code         = optional(number)
        response_page_path    = optional(string)
        error_caching_min_ttl = optional(number)
      })), [])
    })
  })
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
variable "auth_cognito" {
  description = "Cognito user pool and user pool client settings."
  type = object({
    callback_urls = list(string)
    logout_urls   = list(string)

    enabled_identity_providers = optional(list(string), ["COGNITO"])

    google_client_id     = optional(string)
    google_client_secret = optional(string)
  })
}


# -------------------------------------------------------------------------
# GITHUB CICD MODULE
# -------------------------------------------------------------------------
variable "github_cicd" {
  description = "GitHub OIDC settings for CI/CD module."
  type = object({
    github_repo = string
    branches = list(string)
    github_oidc_provider_arn = string
    role_name = string
    managed_policy_arns = list(string)
  })
}