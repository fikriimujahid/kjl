terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ------------------------------------------------------------------------------
# AWS Provider Configuration
# ------------------------------------------------------------------------------
provider "aws" {
  region = var.aws_region
}

locals {
  github_oidc_provider_arn_effective = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : var.github_oidc_provider_arn
}

# ------------------------------------------------------------------------------
# Optional GitHub OIDC Provider Creation
# ------------------------------------------------------------------------------
resource "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 1 : 0

  url = "https://token.actions.githubusercontent.com"
  client_id_list = [
    "sts.amazonaws.com"
  ]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1", // pragma: allowlist secret
    "1c58a3a8518e8759bf075b76b750d4f2df264fcd"  // pragma: allowlist secret
  ]

  tags = {
    project    = var.project
    managed_by = "terraform"
  }
}

# ------------------------------------------------------------------------------
# IAM Modules - Shared Environment Role plus CI/CD Entry Role
# ------------------------------------------------------------------------------
module "iam_role_dev" {
  source = "../../modules/iam-roles/terraform-env"

  environment                = "dev"
  project                    = var.project
  terraform_state_bucket_arn = "arn:aws:s3:::${var.terraform_state_bucket}"
  github_oidc_provider_arn   = local.github_oidc_provider_arn_effective
  github_repo                = var.github_repo
}

module "iam_role_main" {
  source = "../../modules/iam-roles/terraform-env"

  environment                = "main"
  project                    = var.project
  terraform_state_bucket_arn = "arn:aws:s3:::${var.terraform_state_bucket}"
  github_oidc_provider_arn   = local.github_oidc_provider_arn_effective
  github_repo                = var.github_repo
}

module "iam_role_cicd_runner" {
  source = "../../modules/iam-roles/cicd-runner"

  project                  = var.project
  github_oidc_provider_arn = local.github_oidc_provider_arn_effective
  github_repo              = var.github_repo
  assumable_role_arns = [
    module.iam_role_dev.terraform_dev_role_arn,
    module.iam_role_main.terraform_main_role_arn,
  ]
}

# ------------------------------------------------------------------------------
# Terraform Dev Role ARN
# ------------------------------------------------------------------------------
output "terraform_dev_role_arn" {
  description = "Role for GitHub Actions or operators to deploy to development environment"
  value       = module.iam_role_dev.terraform_dev_role_arn
}

# ------------------------------------------------------------------------------
# Terraform Main Role ARN
# ------------------------------------------------------------------------------
output "terraform_main_role_arn" {
  description = "Role for GitHub Actions to deploy to main environment"
  value       = module.iam_role_main.terraform_main_role_arn
}

# ------------------------------------------------------------------------------
# CI/CD Runner Role ARN
# ------------------------------------------------------------------------------
output "cicd_runner_role_arn" {
  description = "Role for GitHub Actions CI/CD runner"
  value       = module.iam_role_cicd_runner.cicd_runner_role_arn
}

# ------------------------------------------------------------------------------
# GitHub OIDC Provider ARN
# ------------------------------------------------------------------------------
output "github_oidc_provider_arn" {
  description = "ARN of GitHub OIDC provider for reference"
  value       = local.github_oidc_provider_arn_effective
}