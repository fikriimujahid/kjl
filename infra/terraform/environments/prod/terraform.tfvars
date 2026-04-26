# ============================================================================
# Common Variables
# ============================================================================
project_name = "kejepangdulu"
environment  = "prod"
tags = {
  Owner       = "platform-team"
  CostCenter  = "kjl"
  Project     = "kejepangdulu"
  Environment = "prod"
  ManagedBy   = "Terraform"
}

# ============================================================================
# Budget Module Variables
# ============================================================================
budget = {
  budget_name            = "kejepangdulu-prod-monthly-budget"
  monthly_budget_limit   = 10
  budget_alert_threshold = 80
  budget_alert_email     = "itsmefikri@gmail.com"
}

# ============================================================================
# Frontend Site Hosting Variables
# ============================================================================ 
frontend_site_hosting = {
  zone_id = "Z0641160BIPE40MMNCVP"
  # S3 STATIC HOSTING BUCKETS
  s3_static_hosting = {
    bucket_name = "kejepangdulu-prod-frontend-bucket"
  }

  # S3 CLOUDFRONT LOG
  s3_cloudfront_log = {
    bucket_name    = "kejepangdulu-prod-cloudfront-logs"
    lifecycle_days = 90
    lifecycle_rules = [
      {
        id      = "ExpireLogsAfter90Days"
        enabled = true
        expiration = {
          days = 90
        }
      }
    ]
  }

  # ACM CONFIGURATION
  acm = {
    domain_name               = "kejepangdulu.click"
    subject_alternative_names = ["kejepangdulu.click"]
    #existing_certificate_arn  = "arn:aws:acm:us-east-1:731099197523:certificate/adba9bcc-d4b9-4b1b-8bb7-204de0c57120"
  }

  # CLOUDFRONT CONFIGURATION
  cloudfront = {
    aliases = ["kejepangdulu.click"]
    custom_error_responses = [
      {
        error_code            = 403
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 0
      },
      {
        error_code            = 404
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 0
      }
    ]
  }
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
auth_cognito = {
  callback_urls = [
    "https://dev.myapp.com/auth/callback"
  ]

  logout_urls = [
    "https://dev.myapp.com/logout"
  ]

  enabled_identity_providers = ["COGNITO"]
}

# ============================================================================
# GitHub CICD Variables
# ============================================================================
github_cicd = {
  github_repo = "fikriimujahid/kjl"
  branches = ["prod"]
  github_oidc_provider_arn = "arn:aws:iam::731099197523:oidc-provider/token.actions.githubusercontent.com"
  role_name = "kejepangdulu-prod-github-oidc-role"
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/CloudFrontFullAccess"
  ]
}


