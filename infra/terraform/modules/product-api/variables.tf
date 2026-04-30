variable "project_name" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Environment name used for resource naming."
  type        = string
}

variable "service_name" {
  description = "Logical service name used for naming Lambda, API, and IAM resources."
  type        = string
}

variable "lambda_function_name" {
  description = "Optional override for the service Lambda function name."
  type        = string
  default     = null
}

variable "lambda_source_dir" {
  description = "Source directory for Lambda deployment package creation."
  type        = string
}

variable "lambda_description" {
  description = "Description of the service Lambda function."
  type        = string
  default     = "Handles public API endpoints."
}

variable "lambda_handler" {
  description = "Lambda handler entrypoint."
  type        = string
  default     = "handler.main"
}

variable "lambda_runtime" {
  description = "Lambda runtime."
  type        = string
  default     = "nodejs20.x"
}

variable "lambda_memory_size" {
  description = "Memory size for the service Lambda function."
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout in seconds for the service Lambda function."
  type        = number
  default     = 10
}

variable "lambda_environment_variables" {
  description = "Environment variables passed to the service Lambda function."
  type        = map(string)
  default     = {}
}

variable "lambda_publish" {
  description = "Whether to publish Lambda versions on updates."
  type        = bool
  default     = true
}

variable "api_name" {
  description = "Optional override for API Gateway API name."
  type        = string
  default     = null
}

variable "api_description" {
  description = "Description for API Gateway API."
  type        = string
  default     = "Public Service API."
}

variable "api_stage_name" {
  description = "Stage name for API Gateway."
  type        = string
  default     = "$default"
}

variable "cors_allow_origins" {
  description = "Allowed CORS origins for the service API."
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "Allowed CORS methods for the service API."
  type        = list(string)
  default     = ["GET", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "Allowed CORS headers for the service API."
  type        = list(string)
  default     = ["content-type", "authorization"]
}

variable "cors_expose_headers" {
  description = "Exposed CORS response headers for the service API."
  type        = list(string)
  default     = []
}

variable "cors_max_age" {
  description = "CORS max age in seconds for the service API."
  type        = number
  default     = 300
}

variable "routes" {
  description = "Map of HTTP route definitions that will be integrated to the service Lambda."
  type = map(object({
    route_key              = string
    payload_format_version = optional(string, "2.0")
    timeout_milliseconds   = optional(number, 30000)
    authorization_type     = optional(string, "NONE")
    authorizer_id          = optional(string)
    operation_name         = optional(string)
  }))
}

variable "integration_timeout_milliseconds" {
  description = "Default integration timeout in milliseconds applied when a route does not override timeout_milliseconds."
  type        = number
  default     = 30000
}

variable "tags" {
  description = "Additional tags applied to service API resources."
  type        = map(string)
  default     = {}
}
