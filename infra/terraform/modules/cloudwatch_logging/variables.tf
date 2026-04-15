variable "lambda_log_group_names" {
  description = "Lambda log group names to create."
  type        = list(string)
}

variable "api_gateway_log_group_names" {
  description = "API Gateway log group names to create."
  type        = list(string)
}

variable "retention_in_days" {
  description = "CloudWatch Logs retention in days."
  type        = number
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
