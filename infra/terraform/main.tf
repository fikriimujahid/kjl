locals {
  name_prefix       = "${var.project_name}/${var.environment}"
  state_bucket_name = "terraform-state-${data.aws_caller_identity.current.account_id}"
  lock_table_name   = "terraform-lock-${data.aws_caller_identity.current.account_id}"

  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
      Layer       = "bootstrap"
    },
    var.tags
  )
}

data "aws_caller_identity" "current" {}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

module "s3_state_backend" {
  source = "./modules/s3_state_backend"

  bucket_name   = local.state_bucket_name
  create_bucket = var.create_state_bucket
  tags          = local.common_tags
}

module "dynamodb_lock_table" {
  source = "./modules/dynamodb_lock_table"

  table_name   = local.lock_table_name
  create_table = var.create_lock_table
  tags         = local.common_tags
}

module "cloudwatch_logging" {
  source = "./modules/cloudwatch_logging"

  lambda_log_group_names      = var.lambda_log_group_names
  api_gateway_log_group_names = var.api_gateway_log_group_names
  retention_in_days           = var.log_retention_days
  tags                        = local.common_tags
}

module "budget_alert" {
  source = "./modules/budget_alert"

  budget_name            = "${local.name_prefix}-monthly-budget"
  monthly_budget_limit   = var.monthly_budget_limit
  budget_alert_threshold = var.budget_alert_threshold
  budget_alert_email     = var.budget_alert_email
}

# module "iam_bootstrap_roles" {
#   source = "./modules/iam_bootstrap_roles"

#   project_name                       = var.project_name
#   environment                        = var.environment
#   state_bucket_arn                   = module.s3_state_backend.bucket_arn
#   lock_table_arn                     = module.dynamodb_lock_table.table_arn
#   terraform_execution_principal_arns = var.terraform_execution_principal_arns
#   cloudfront_origin_bucket_arns      = var.cloudfront_origin_bucket_arns
#   tags                               = local.common_tags
# }
