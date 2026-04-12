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