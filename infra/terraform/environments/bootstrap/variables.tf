variable "project" {
  description = "Project name used to tag bootstrap resources"
  type        = string
}

variable "aws_region" {
  description = "AWS region where bootstrap resources are created"
  type        = string
}

variable "terraform_state_bucket" {
  description = "Name of the S3 bucket used for Terraform state"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in owner/repo format allowed to assume OIDC roles"
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Whether bootstrap should create the GitHub OIDC provider instead of using an existing ARN"
  type        = bool
  default     = false
}

variable "github_oidc_provider_arn" {
  description = "ARN of an existing GitHub OIDC provider in AWS IAM (required when create_github_oidc_provider is false)"
  type        = string
  default     = ""

  validation {
    condition     = var.create_github_oidc_provider || length(trimspace(var.github_oidc_provider_arn)) > 0
    error_message = "Set github_oidc_provider_arn when create_github_oidc_provider is false."
  }
}