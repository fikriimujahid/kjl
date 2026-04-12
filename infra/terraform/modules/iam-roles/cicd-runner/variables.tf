variable "project" {
  description = "Project name used to tag IAM resources"
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

variable "assumable_role_arns" {
  description = "IAM role ARNs the CI/CD runner may assume"
  type        = list(string)
}