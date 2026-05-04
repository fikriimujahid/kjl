# -----------------------------------------------------------------------------
# LAMBDAS
# -----------------------------------------------------------------------------
variable "lambdas" {
  description = "Map of Lambda function settings keyed by integration key."
  type = map(object({
    name                  = string
    description           = optional(string)
    source_dir            = string
    handler               = string
    runtime               = string
    memory_size           = number
    timeout               = number
    environment_variables = map(string)
    publish               = bool
    dynamodb_actions      = optional(list(string))
    s3_bucket_read_arns   = optional(list(string), [])
    s3_actions            = optional(list(string))
  }))

  validation {
    condition     = length(var.lambdas) > 0
    error_message = "At least one lambda must be configured in `lambdas`."
  }
}

variable "dynamodb_table_arns" {
  description = "DynamoDB table ARNs that lambdas can access."
  type        = list(string)
  default     = []
}

variable "dynamodb_actions" {
  description = "Default DynamoDB actions granted to lambda roles for configured table ARNs."
  type        = list(string)
  default     = ["dynamodb:Query"]
}

variable "s3_read_actions" {
  description = "Default S3 read actions granted to lambda roles for configured S3 bucket ARNs."
  type        = list(string)
  default     = ["s3:GetObject", "s3:ListBucket"]
}

variable "additional_integrations" {
  description = "Additional non-managed Lambda integrations selectable by integration_key."
  type = map(object({
    integration_uri = string
    function_name   = string
  }))
  default = {}
}

# -----------------------------------------------------------------------------
# API GATEWAY
# -----------------------------------------------------------------------------
variable "api_gateway" {
  description = "API Gateway settings for the service API."
  type = object({
    name        = string
    description = string
    stage_name  = string

    cors_allow_origins  = list(string)
    cors_allow_methods  = list(string)
    cors_allow_headers  = list(string)
    cors_expose_headers = list(string)
    cors_max_age        = number

    routes = map(object({
      route_key              = string
      payload_format_version = optional(string, "2.0")
      timeout_milliseconds   = optional(number, 30000)
      authorization_type     = optional(string, "NONE")
      authorizer_id          = optional(string)
      operation_name         = optional(string)
      integration_key        = string
    }))
  })
}

variable "jwt_authorizer" {
  description = "Optional JWT authorizer configuration for API Gateway HTTP API routes."
  type = object({
    name             = optional(string, "service-api-jwt-authorizer")
    issuer           = string
    audience         = list(string)
    identity_sources = optional(list(string), ["$request.header.Authorization"])
  })
  default = null
}

variable "tags" {
  description = "Additional tags applied to service API resources."
  type        = map(string)
  default     = {}
}
