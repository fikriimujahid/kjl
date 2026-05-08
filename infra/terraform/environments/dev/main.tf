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
# PRODUCT CATALOG BUCKET (PUBLIC VIA CLOUDFRONT)
# -------------------------------------------------------------------------
module "catalog_public_bucket" {
  source = "../../modules/s3"

  bucket_name        = "${var.project_name}-${var.environment}-public"
  force_destroy      = false
  tags               = var.tags
  versioning_enabled = false

  encryption = {
    sse_algorithm      = "AES256"
    kms_master_key_id  = null
    bucket_key_enabled = true
  }

  lifecycle_config = {
    lifecycle_days  = null
    lifecycle_rules = []
  }

  security = {
    public_access_block = {
      block_public_acls       = true
      block_public_policy     = true
      ignore_public_acls      = true
      restrict_public_buckets = true
    }
    object_ownership            = "BucketOwnerEnforced"
    attach_tls_only_policy      = false
    additional_policy_documents = []
  }
}

# -------------------------------------------------------------------------
# PRIVATE MEDIA BUCKET
# -------------------------------------------------------------------------
module "media_private_bucket" {
  source = "../../modules/s3"

  bucket_name        = "${var.project_name}-${var.environment}-media-private"
  force_destroy      = false
  tags               = var.tags
  versioning_enabled = true

  encryption = {
    sse_algorithm      = "AES256"
    kms_master_key_id  = null
    bucket_key_enabled = true
  }

  lifecycle_config = {
    lifecycle_days  = null
    lifecycle_rules = []
  }

  security = {
    public_access_block = {
      block_public_acls       = true
      block_public_policy     = true
      ignore_public_acls      = true
      restrict_public_buckets = true
    }
    object_ownership            = "BucketOwnerEnforced"
    attach_tls_only_policy      = true
    additional_policy_documents = []
  }
}

# -------------------------------------------------------------------------
# DYNAMODB MODULE
# -------------------------------------------------------------------------
module "learning_content_table" {
  source = "../../modules/dynamodb"

  table_name                     = var.learning_content_table.table_name
  billing_mode                   = var.learning_content_table.billing_mode
  hash_key                       = var.learning_content_table.hash_key
  range_key                      = try(var.learning_content_table.range_key, null)
  attributes                     = var.learning_content_table.attributes
  global_secondary_indexes       = try(var.learning_content_table.global_secondary_indexes, [])
  ttl_enabled                    = var.learning_content_table.ttl_enabled
  ttl_attribute_name             = try(var.learning_content_table.ttl_attribute_name, null)
  point_in_time_recovery_enabled = var.learning_content_table.point_in_time_recovery_enabled
  server_side_encryption_enabled = var.learning_content_table.server_side_encryption_enabled

  tags = var.tags
}


# -------------------------------------------------------------------------
# SERVICE API MODULE
# -------------------------------------------------------------------------
module "service_api" {
  source = "../../modules/service-api"

  lambdas = {
    for key, lambda_cfg in var.service_api.lambdas : key => {
      name                  = lambda_cfg.name
      description           = try(lambda_cfg.description, null)
      source_dir            = lambda_cfg.source_dir
      handler               = lambda_cfg.handler
      runtime               = lambda_cfg.runtime
      memory_size           = lambda_cfg.memory_size
      timeout               = lambda_cfg.timeout
      environment_variables = lambda_cfg.environment_variables
      publish               = lambda_cfg.publish
      dynamodb_access       = try(lambda_cfg.dynamodb_access, {})
      s3_access             = try(lambda_cfg.s3_access, {})
    }
  }

  api_gateway = {
    name                = var.service_api.api_gateway.name
    description         = var.service_api.api_gateway.description
    stage_name          = var.service_api.api_gateway.stage_name
    cors_allow_origins  = var.service_api.api_gateway.cors_allow_origins
    cors_allow_methods  = var.service_api.api_gateway.cors_allow_methods
    cors_allow_headers  = var.service_api.api_gateway.cors_allow_headers
    cors_expose_headers = var.service_api.api_gateway.cors_expose_headers
    cors_max_age        = var.service_api.api_gateway.cors_max_age
    routes              = var.service_api.api_gateway.routes
  }

  jwt_authorizer = {
    name     = "${var.project_name}-${var.environment}-product-api-jwt-authorizer"
    issuer   = module.cognito.cognito_uri
    audience = [module.cognito.user_pool_client_id]
  }

  tags = var.tags
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
    public_origin = {
      enabled                     = true
      bucket_name                 = module.catalog_public_bucket.bucket_name
      bucket_regional_domain_name = module.catalog_public_bucket.bucket_regional_domain_name
      manage_bucket_policy        = true
    }
    api_origin = {
      enabled      = true
      domain_name  = module.service_api.api_gateway_domain_name
      path_pattern = var.service_api.cloudfront_path_pattern
      origin_path  = module.service_api.api_gateway_origin_path
    }
    custom_error_responses = var.frontend_site_hosting.cloudfront.custom_error_responses
  }

  # OPTIONAL: Extra resource tags
  tags = var.tags
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
module "cognito" {
  source = "../../modules/cognito-auth-api"

  project_name = var.project_name
  environment  = var.environment

  callback_urls = var.auth_cognito.callback_urls

  logout_urls = var.auth_cognito.logout_urls

  token_validity = try(var.auth_cognito.token_validity, {})

  enabled_identity_providers    = var.auth_cognito.enabled_identity_providers
  verification_message_template = try(var.auth_cognito.verification_message_template, null)
  google_client_id              = try(var.auth_cognito.google_client_id, null)
  google_client_secret          = try(var.auth_cognito.google_client_secret, null)
}

# -------------------------------------------------------------------------
# GITHUB CICD MODULE
# -------------------------------------------------------------------------
module "github_cicd" {
  source = "../../modules/iam-role-github-oidc"

  github_repo              = var.github_cicd.github_repo
  branches                 = var.github_cicd.branches
  github_oidc_provider_arn = var.github_cicd.github_oidc_provider_arn
  role_name                = var.github_cicd.role_name
  managed_policy_arns      = var.github_cicd.managed_policy_arns

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

