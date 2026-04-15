variable "table_name" {
  description = "Name of the DynamoDB table used for Terraform state locking."
  type        = string
}

variable "create_table" {
  description = "If true, create the lock table. If false, use an existing table with the same name."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
