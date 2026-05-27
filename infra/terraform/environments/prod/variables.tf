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
      rewrite_config = optional(object({
        default_index_file           = optional(string, "index.html")
        enable_trailing_slash_index = optional(bool, true)
        enable_extensionless_index  = optional(bool, true)
        extension_index_rules = optional(list(object({
          extension  = string
          index_file = optional(string, "index.html")
        })), [])
        ignored_prefixes    = optional(list(string), ["/_next/", "/api/", "/public-data/"])
        ignored_contains    = optional(list(string), ["/__next."])
        ignored_exact_paths = optional(list(string), [])
      }), {})
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
# SERVICE API MODULE
# -------------------------------------------------------------------------
variable "service_api" {
  description = "Service API settings for Lambda, API Gateway, and CloudFront route path."
  type = object({
    lambdas = map(object({
      name                  = string
      description           = optional(string)
      source_dir            = string
      handler               = string
      runtime               = string
      memory_size           = number
      timeout               = number
      environment_variables = map(string)
      publish               = bool
      dynamodb_access = optional(map(object({
        table_arn = optional(string)
        read      = optional(bool, false)
        write     = optional(bool, false)
      })), {})
      s3_access = optional(map(object({
        s3_arn = string
        read   = optional(bool, false)
        write  = optional(bool, false)
      })), {})
    }))

    api_gateway = object({
      name                = optional(string)
      description         = optional(string)
      stage_name          = optional(string)
      cors_allow_origins  = list(string)
      cors_allow_methods  = list(string)
      cors_allow_headers  = list(string)
      cors_expose_headers = list(string)
      cors_max_age        = number
      routes = map(object({
        route_key              = string
        payload_format_version = optional(string)
        timeout_milliseconds   = optional(number)
        authorization_type     = optional(string)
        authorizer_id          = optional(string)
        operation_name         = optional(string)
        integration_key        = string
      }))
    })

    cloudfront_path_pattern = string
  })
}

# -------------------------------------------------------------------------
# PRODUCTS DYNAMODB MODULE
# -------------------------------------------------------------------------
variable "products_table" {
  description = "DynamoDB table configuration for products."
  type = object({
    table_name   = string
    billing_mode = string
    hash_key     = string
    range_key    = optional(string)
    attributes = list(object({
      name = string
      type = string
    }))
    global_secondary_indexes = optional(list(object({
      name               = string
      hash_key           = string
      range_key          = optional(string)
      projection_type    = string
      non_key_attributes = optional(list(string), [])
      read_capacity      = optional(number)
      write_capacity     = optional(number)
    })), [])
    ttl_enabled                    = bool
    ttl_attribute_name             = optional(string)
    point_in_time_recovery_enabled = bool
    server_side_encryption_enabled = bool
  })
}

# -------------------------------------------------------------------------
# DYNAMODB LEARNING CONTENT TABLE
# -------------------------------------------------------------------------
variable "learning_content_table" {
  description = "DynamoDB table configuration for learning content."
  type = object({
    table_name   = string
    billing_mode = string
    hash_key     = string
    range_key    = optional(string)
    attributes = list(object({
      name = string
      type = string
    }))
    global_secondary_indexes = optional(list(object({
      name               = string
      hash_key           = string
      range_key          = optional(string)
      projection_type    = string
      non_key_attributes = optional(list(string), [])
      read_capacity      = optional(number)
      write_capacity     = optional(number)
    })), [])
    ttl_enabled                    = bool
    ttl_attribute_name             = optional(string)
    point_in_time_recovery_enabled = bool
    server_side_encryption_enabled = bool
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

    user_pool_schema_attributes = optional(list(object({
      name                     = string
      attribute_data_type      = string
      developer_only_attribute = optional(bool, false)
      mutable                  = optional(bool, true)
      required                 = optional(bool, false)
      string_attribute_constraints = optional(object({
        min_length = optional(number)
        max_length = optional(number)
      }))
      number_attribute_constraints = optional(object({
        min_value = optional(number)
        max_value = optional(number)
      }))
      })), [
      {
        name                = "email"
        attribute_data_type = "String"
        required            = true
        mutable             = true
        string_attribute_constraints = {
          min_length = 5
          max_length = 2048
        }
      }
    ])

    token_validity = optional(object({
      access_token_validity  = optional(number)
      id_token_validity      = optional(number)
      refresh_token_validity = optional(number)
      token_validity_units = optional(object({
        access_token  = optional(string, "hours")
        id_token      = optional(string, "hours")
        refresh_token = optional(string, "days")
      }), {})
    }), {})

    enabled_identity_providers = optional(list(string), ["COGNITO"])
    verification_message_template = optional(object({
      default_email_option  = optional(string)
      email_message         = optional(string)
      email_message_by_link = optional(string)
      email_subject         = optional(string)
      email_subject_by_link = optional(string)
      sms_message           = optional(string)
    }))

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
    github_repo              = string
    branches                 = list(string)
    github_oidc_provider_arn = string
    role_name                = string
    managed_policy_arns      = list(string)
  })
}