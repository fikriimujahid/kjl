variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment. Allowed values: dev, prod."
  type        = string

  validation {
    condition     = contains(["dev", "prod"], var.environment)
    error_message = "environment must be either dev or prod."
  }
}

variable "state_bucket_arn" {
  description = "ARN of the Terraform remote state S3 bucket."
  type        = string
}

variable "lock_table_arn" {
  description = "ARN of the Terraform lock DynamoDB table."
  type        = string
}

variable "terraform_execution_principal_arns" {
  description = "List of IAM principal ARNs allowed to assume terraform execution role."
  type        = list(string)
  default     = []
}

variable "cloudfront_origin_bucket_arns" {
  description = "Optional S3 bucket ARNs that cloudfront-access-role can read."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
