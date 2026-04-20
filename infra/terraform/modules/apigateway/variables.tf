variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment identifier."
  type        = string
}

variable "rest_api_name" {
  description = "Optional explicit REST API name."
  type        = string
  default     = null
}

variable "stage_name" {
  description = "Optional explicit stage name. Defaults to environment."
  type        = string
  default     = null
}

variable "cors_allow_origins" {
  description = "List of allowed origins for CORS responses."
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_methods" {
  description = "List of allowed methods for CORS responses."
  type        = list(string)
  default     = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}

variable "cors_allow_headers" {
  description = "List of allowed headers for CORS responses."
  type        = list(string)
  default = [
    "Content-Type",
    "Authorization",
    "X-Amz-Date",
    "X-Api-Key",
    "X-Amz-Security-Token"
  ]
}

variable "logging_level" {
  description = "Execution logging level for API Gateway methods."
  type        = string
  default     = "INFO"

  validation {
    condition     = contains(["OFF", "ERROR", "INFO"], var.logging_level)
    error_message = "logging_level must be OFF, ERROR, or INFO."
  }
}

variable "enable_data_trace" {
  description = "Enable full request/response data tracing in method execution logs."
  type        = bool
  default     = false
}

variable "xray_tracing_enabled" {
  description = "Enable AWS X-Ray tracing for the API Gateway stage."
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention for API access logs."
  type        = number
  default     = 30
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
