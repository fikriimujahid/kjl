variable "github_oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider in AWS IAM (must be created separately)"
  type        = string
}

variable "github_repo" {
  description = "GitHub repository in format 'owner/repo' (e.g., 'fikriimujahid/p1-serverless-web-app') - used for OIDC authentication"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9-_.]+/[a-zA-Z0-9-_.]+$", var.github_repo))
    error_message = "GitHub repo must be in format 'owner/repo' with valid GitHub username and repository name."
  }
}

variable "branches" {
  description = "Allowed GitHub branches for OIDC trust (e.g., ['main', 'release'])"
  type        = list(string)
}

variable "role_name" {
  description = "Explicit name for the GitHub OIDC role."
  type        = string
}

variable "managed_policy_arns" {
  description = "List of managed IAM policy ARNs to attach to the GitHub OIDC role."
  type        = list(string)
}

variable "tags" {
  description = "Tags applied to ACM and Route53 resources created by this module."
  type        = map(string)
  default     = {}
}