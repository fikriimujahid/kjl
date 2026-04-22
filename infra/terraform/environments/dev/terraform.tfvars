# ============================================================================
# Common Variables
# ============================================================================
project_name = "kejepangdulu"
environment  = "dev"
tags = {
  Owner       = "platform-team"
  CostCenter  = "kjl"
  Project     = "kejepangdulu"
  Environment = "dev"
  ManagedBy   = "Terraform"
}

# ============================================================================
# Budget Module Variables
# ============================================================================
budget = {
  budget_name            = "kejepangdulu-dev-monthly-budget"
  monthly_budget_limit   = 10
  budget_alert_threshold = 80
  budget_alert_email     = "itsmefikri@gmail.com"
}

# ============================================================================
# Frontend Site Hosting Variables
# ============================================================================
frontend_site_hosting = {
  zone_id = "Z019716819YT0PPFWXQPV"
  # S3 STATIC HOSTING BUCKETS
  s3_static_hosting = {
    bucket_name = "kejepangdulu-dev-frontend-bucket"
  }

  # S3 CLOUDFRONT LOG
  s3_cloudfront_log = {
    bucket_name    = "kejepangdulu-dev-cloudfront-logs"
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
    # domain_name               = "fikri.dev"
    # subject_alternative_names = ["*.fikri.dev"]
    # zone_id                   = "Z019716819YT0PPFWXQPV"
    existing_certificate_arn  = "arn:aws:acm:us-east-1:731099197523:certificate/adba9bcc-d4b9-4b1b-8bb7-204de0c57120"
  }

  # CLOUDFRONT CONFIGURATION
  cloudfront = {
    aliases = ["kjl.fikri.dev"]
  }
}

# Set explicit IAM principal ARNs if required by your org.
terraform_execution_principal_arns = []


