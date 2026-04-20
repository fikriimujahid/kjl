locals {
  name_prefix = "${var.project_name}-${var.environment}"
}
data "aws_caller_identity" "current" {}
data "aws_s3_bucket" "state_backend" {
  bucket = "terraform-state-${data.aws_caller_identity.current.account_id}"
}
data "aws_dynamodb_table" "lock_table" {
  name = "terraform-lock-${data.aws_caller_identity.current.account_id}"
}

# -------------------------------------------------------------------------
# BUDGET MODULE
# -------------------------------------------------------------------------
module "budget_alert" {
  source = "../../modules/budget_alert"

  budget_name            = var.budget.budget_name
  monthly_budget_limit   = var.budget.monthly_budget_limit
  budget_alert_threshold = var.budget.budget_alert_threshold
  budget_alert_email     = var.budget.budget_alert_email
}

# -------------------------------------------------------------------------
# FRONTEND SITE HOSTING MODULE
# -------------------------------------------------------------------------
module "frontend_site_hosting" {
  source = "../../modules/static-hosting"
  # -------------------------------------------------------------------------
  # BUCKET CONFIGURATION
  # -------------------------------------------------------------------------
  buckets = {
    frontend = {
      bucket_name = var.frontend_site_hosting.buckets.frontend.bucket_name
    }

    logs = {
      log_prefix = var.frontend_site_hosting.buckets.logs.log_prefix
      bucket_name = var.frontend_site_hosting.buckets.logs.bucket_name
      lifecycle_rules = [
        {
          id      = "ExpireLogsAfter90Days"
          enabled = true
          prefix  = var.frontend_site_hosting.buckets.logs.log_prefix
          expiration = {
            days = 90
          }
        }
      ]
    }
  }

  # -------------------------------------------------------------------------
  # ACM CONFIGURATION
  # -------------------------------------------------------------------------
  acm = {
    domain_name = var.frontend_site_hosting.acm.domain_name
    subject_alternative_names = [
      "${var.frontend_site_hosting.acm.domain_name}"
    ]
    zone_id = var.frontend_site_hosting.acm.zone_id
  }

  # -------------------------------------------------------------------------
  # CLOUDFRONT CONFIGURATION
  # -------------------------------------------------------------------------
  cloudfront = {
    project_name = var.project_name
    environment  = var.environment
    aliases      = var.frontend_site_hosting.cloudfront.aliases
  }

  # -------------------------------------------------------------------------
  # OPTIONAL: Extra resource tags
  # -------------------------------------------------------------------------
  tags = var.tags
}

# module "app_s3" {
#   source = "./modules/s3"

#   buckets = {
#     "${var.project_name}-${var.environment}-content-private" = {
#       versioning_enabled = true
#       force_destroy      = false
#       ownership          = "BucketOwnerEnforced"
#       lifecycle_days     = 365
#     }

#     "${var.project_name}-${var.environment}-backup" = {
#       versioning_enabled = true
#       force_destroy      = false
#       ownership          = "BucketOwnerPreferred"
#       lifecycle_days     = 365
#     }
#   }

#   create_iam_policies = true

#   tags = local.common_tags
# }

# module "app_dynamodb" {
#   source = "./modules/dynamodb"

#   project_name                   = var.project_name
#   environment                    = var.environment
#   table_name_overrides           = var.dynamodb_table_name_overrides
#   point_in_time_recovery_enabled = var.dynamodb_point_in_time_recovery_enabled
#   create_iam_policies            = var.create_app_iam_policies
#   tags                           = local.app_tags
# }

# module "app_apigateway" {
#   source = "./modules/apigateway"

#   project_name         = var.project_name
#   environment          = var.environment
#   rest_api_name        = var.api_gateway_name
#   stage_name           = var.api_stage_name
#   cors_allow_origins   = var.api_cors_allow_origins
#   cors_allow_methods   = var.api_cors_allow_methods
#   cors_allow_headers   = var.api_cors_allow_headers
#   logging_level        = var.api_logging_level
#   enable_data_trace    = var.api_enable_data_trace
#   xray_tracing_enabled = var.api_xray_tracing_enabled
#   log_retention_days   = var.log_retention_days
#   tags                 = local.app_tags
# }