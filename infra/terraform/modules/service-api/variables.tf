# -----------------------------------------------------------------------------
# LAMBDA
# -----------------------------------------------------------------------------
variable "lambda" {
  description = "Lambda function settings for the service API."
  type = object({
    name                  = string
    description           = string
    source_dir            = string
    handler               = string
    runtime               = string
    memory_size           = number
    timeout               = number
    environment_variables = map(string)
    publish               = bool
  })
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
    }))
  })
}

variable "tags" {
  description = "Additional tags applied to service API resources."
  type        = map(string)
  default     = {}
}
