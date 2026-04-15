variable "aws_region" {
  description = "AWS region for bootstrap resources."
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
  default     = "kejepangdulu"
}

variable "create_state_bucket" {
  description = "If true, create terraform-state-<aws_account_id> bucket. If false, use existing bucket with that name."
  type        = bool
  default     = true
}

variable "create_lock_table" {
  description = "If true, create terraform-lock-<aws_account_id> table. If false, use existing table with that name."
  type        = bool
  default     = true
}

variable "environment" {
  description = "Deployment environment. Allowed values: dev, prod."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be either dev or prod."
  }
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days."
  type        = number
  default     = 30
}

variable "monthly_budget_limit" {
  description = "Monthly AWS budget limit in USD."
  type        = number
  default     = 20
}

variable "budget_alert_threshold" {
  description = "Budget alert threshold as percentage."
  type        = number
  default     = 80
}

variable "budget_alert_email" {
  description = "Email recipient for budget alerts."
  type        = string
  default     = "ops@example.com"
}

variable "terraform_execution_principal_arns" {
  description = "List of IAM principal ARNs allowed to assume terraform execution role. If empty, account root principal is used."
  type        = list(string)
  default     = []
}

variable "lambda_log_group_names" {
  description = "Explicit Lambda log group names to create. Set in environment tfvars."
  type        = list(string)
  default     = []
}

variable "api_gateway_log_group_names" {
  description = "Explicit API Gateway log group names to create. Set in environment tfvars."
  type        = list(string)
  default     = []
}

variable "cloudfront_origin_bucket_arns" {
  description = "Optional S3 bucket ARNs that cloudfront-access-role can read."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Additional tags applied to all resources."
  type        = map(string)
  default     = {}
}
