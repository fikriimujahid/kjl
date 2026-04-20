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
    buckets = object({
      frontend = object({
        bucket_name = string
      })

      logs = object({
        log_prefix = string
        bucket_name = string
        lifecycle_rules = list(object({
          id      = string
          enabled = bool
          prefix  = string
          expiration = object({
            days = number
          })
        }))
      })
    })

    acm = object({
      domain_name               = string
      zone_id                   = string
    })

    cloudfront = object({
      aliases = list(string)
    })
  })
}




variable "terraform_execution_principal_arns" {
  description = "List of IAM principal ARNs allowed to assume terraform execution role. If empty, account root principal is used."
  type        = list(string)
  default     = []
}

variable "cloudfront_origin_bucket_arns" {
  description = "Optional S3 bucket ARNs that cloudfront-access-role can read."
  type        = list(string)
  default     = []
}

variable "dynamodb_table_name_overrides" {
  description = "Optional map to override default DynamoDB table names by logical key."
  type        = map(string)
  default     = {}
}

variable "dynamodb_point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery for app DynamoDB tables."
  type        = bool
  default     = true
}

variable "api_gateway_name" {
  description = "Optional explicit API Gateway REST API name."
  type        = string
  default     = null
}

variable "api_stage_name" {
  description = "Optional explicit API Gateway stage name. Defaults to environment."
  type        = string
  default     = null
}

variable "api_cors_allow_origins" {
  description = "CORS allowed origins for API Gateway responses."
  type        = list(string)
  default     = ["*"]
}

variable "api_cors_allow_methods" {
  description = "CORS allowed methods for API Gateway responses."
  type        = list(string)
  default     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "api_cors_allow_headers" {
  description = "CORS allowed headers for API Gateway responses."
  type        = list(string)
  default = [
    "Content-Type",
    "Authorization",
    "X-Amz-Date",
    "X-Api-Key",
    "X-Amz-Security-Token"
  ]
}

variable "api_logging_level" {
  description = "API Gateway method logging level."
  type        = string
  default     = "INFO"

  validation {
    condition     = contains(["OFF", "ERROR", "INFO"], var.api_logging_level)
    error_message = "api_logging_level must be OFF, ERROR, or INFO."
  }
}

variable "api_enable_data_trace" {
  description = "Enable detailed request/response tracing in API Gateway execution logs."
  type        = bool
  default     = false
}

variable "api_xray_tracing_enabled" {
  description = "Enable X-Ray tracing on API Gateway stage."
  type        = bool
  default     = false
}

