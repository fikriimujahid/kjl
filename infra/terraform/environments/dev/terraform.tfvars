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
  buckets = {
    frontend = {
      bucket_name = "kejepangdulu-dev-frontend-bucket"
    }
    logs = {
      log_prefix = "cloudfront/dev/"
      bucket_name = "kejepangdulu-dev-cloudfront-logs"
      lifecycle_rules = [
        {
          id      = "ExpireLogsAfter90Days"
          enabled = true
          prefix  = "cloudfront/dev/"
          expiration = {
            days = 90
          }
        }
      ]
    }
  }

  acm = {
    domain_name = "dev.kejepangdulu.click"
    zone_id     = "Z0641160BIPE40MMNCVP"
  }

  cloudfront = {
    aliases = ["dev.kejepangdulu.click"]
  }
}

# Set explicit IAM principal ARNs if required by your org.
terraform_execution_principal_arns = []


