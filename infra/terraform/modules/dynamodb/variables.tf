variable "project_name" {
  description = "Project prefix used in resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment identifier."
  type        = string
}

variable "table_name_overrides" {
  description = "Optional map to override default table names by logical key."
  type        = map(string)
  default     = {}
}

variable "point_in_time_recovery_enabled" {
  description = "Enable point-in-time recovery for all tables."
  type        = bool
  default     = true
}

variable "create_iam_policies" {
  description = "If true, create IAM policies for DynamoDB read/write and read-only access."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
