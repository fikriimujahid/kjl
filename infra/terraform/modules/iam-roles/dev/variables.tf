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