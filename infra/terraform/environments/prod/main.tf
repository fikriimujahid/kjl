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
  # S3 STATIC HOSTING BUCKETS
  s3_static_hosting = {
    bucket_name = var.frontend_site_hosting.s3_static_hosting.bucket_name
  }

  # S3 CLOUDFRONT LOG
  s3_cloudfront_log = {
    bucket_name     = var.frontend_site_hosting.s3_cloudfront_log.bucket_name
    lifecycle_days  = var.frontend_site_hosting.s3_cloudfront_log.lifecycle_days
    lifecycle_rules = var.frontend_site_hosting.s3_cloudfront_log.lifecycle_rules
  }

  # ACM CONFIGURATION
  acm = {
    domain_name               = try(var.frontend_site_hosting.acm.domain_name, null)
    subject_alternative_names = try(var.frontend_site_hosting.acm.subject_alternative_names, [])
    zone_id                   = try(var.frontend_site_hosting.zone_id, null)
    existing_certificate_arn  = try(var.frontend_site_hosting.acm.existing_certificate_arn, null)
  }

  # CLOUDFRONT CONFIGURATION
  cloudfront = {
    project_name = var.project_name
    environment  = var.environment
    aliases      = var.frontend_site_hosting.cloudfront.aliases
    zone_id      = var.frontend_site_hosting.zone_id
  }

  # OPTIONAL: Extra resource tags
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

# module "cognito" {
#   source = "../../modules/cognito-auth-api"

#   project_name = "myapp"
#   environment  = "prod"

#   callback_urls = [
#     "https://prod.myapp.com/auth/callback"
#   ]

#   logout_urls = [
#     "https://prod.myapp.com/logout"
#   ]

#   google_client_id     = var.google_client_id
#   google_client_secret = var.google_client_secret
# }