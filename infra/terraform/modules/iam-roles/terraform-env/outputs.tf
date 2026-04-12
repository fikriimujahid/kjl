output "terraform_dev_role_arn" {
  description = "ARN of the Terraform development role"
  value       = var.environment == "dev" ? aws_iam_role.terraform_env.arn : null
}

output "terraform_main_role_arn" {
  description = "ARN of the Terraform main role"
  value       = var.environment == "main" ? aws_iam_role.terraform_env.arn : null
}

output "permissions_boundary_policy_arn" {
  description = "ARN of the permissions boundary policy required on Terraform-created roles"
  value       = var.environment == "dev" ? aws_iam_policy.permissions_boundary[0].arn : local.permissions_boundary
}