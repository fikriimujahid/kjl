variable "bucket_name" {
  description = "Name of the S3 bucket used for Terraform remote state."
  type        = string
}

variable "create_bucket" {
  description = "If true, create the bucket. If false, assume bucket already exists and just reference it."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
