variable "environment" {
  description = "Environment name (dev or main)"
  type        = string

  validation {
    condition     = contains(["dev", "main"], var.environment)
    error_message = "Environment must be dev or main."
  }
}

variable "project" {
  description = "Project name used to tag IAM resources"
  type        = string
}

variable "terraform_state_bucket_arn" {
  description = "ARN of the S3 bucket used for Terraform state"
  type        = string
}

variable "github_oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format"
  type        = string
}

variable "hosted_zone_id" {
  description = "Optional Route53 hosted zone ID to scope permissions boundary Route53 access"
  type        = string
  default     = null
}