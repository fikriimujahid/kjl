variable "name" {
  description = "Name of the HTTP API Gateway."
  type        = string
}

variable "description" {
  description = "Description of the API Gateway."
  type        = string
  default     = null
}

variable "protocol_type" {
  description = "Protocol type for API Gateway."
  type        = string
  default     = "HTTP"

  validation {
    condition     = contains(["HTTP", "WEBSOCKET"], var.protocol_type)
    error_message = "protocol_type must be HTTP or WEBSOCKET."
  }
}

variable "route_selection_expression" {
  description = "Route selection expression for API Gateway."
  type        = string
  default     = "$request.method $request.path"
}

variable "stage_name" {
  description = "API Gateway stage name."
  type        = string
  default     = "$default"
}

variable "auto_deploy" {
  description = "Whether API Gateway stage deployments happen automatically."
  type        = bool
  default     = true
}

variable "access_log_enabled" {
  description = "Whether to enable API Gateway stage access logs in CloudWatch."
  type        = bool
  default     = false
}

variable "access_log_retention_in_days" {
  description = "CloudWatch Logs retention (days) for API Gateway access logs."
  type        = number
  default     = 14
}

variable "access_log_format" {
  description = "Access log format for API Gateway stage logs."
  type        = string
  default     = "{\"requestId\":\"$context.requestId\",\"ip\":\"$context.identity.sourceIp\",\"requestTime\":\"$context.requestTime\",\"httpMethod\":\"$context.httpMethod\",\"routeKey\":\"$context.routeKey\",\"status\":\"$context.status\",\"protocol\":\"$context.protocol\",\"responseLength\":\"$context.responseLength\",\"integrationError\":\"$context.integrationErrorMessage\"}"
}

variable "cors_configuration" {
  description = "Optional CORS settings for HTTP API."
  type = object({
    allow_credentials = optional(bool, false)
    allow_headers     = optional(list(string), ["content-type", "authorization"])
    allow_methods     = optional(list(string), ["GET", "OPTIONS"])
    allow_origins     = optional(list(string), ["*"])
    expose_headers    = optional(list(string), [])
    max_age           = optional(number, 300)
  })
  default = null
}

variable "jwt_authorizer" {
  description = "Optional JWT authorizer configuration used for routes with authorization_type JWT."
  type = object({
    name             = optional(string, "http-api-jwt-authorizer")
    issuer           = string
    audience         = list(string)
    identity_sources = optional(list(string), ["$request.header.Authorization"])
  })
  default = null
}

variable "routes" {
  description = "Map of route definitions keyed by logical route name."
  type = map(object({
    route_key              = string
    integration_uri        = string
    integration_type       = optional(string, "AWS_PROXY")
    integration_method     = optional(string, "POST")
    payload_format_version = optional(string, "2.0")
    timeout_milliseconds   = optional(number, 30000)
    authorization_type     = optional(string, "NONE")
    authorizer_id          = optional(string)
    operation_name         = optional(string)
  }))
  default = {}
}

variable "tags" {
  description = "Tags applied to API Gateway resources."
  type        = map(string)
  default     = {}
}
