output "terraform_prod_role_arn" {
  description = "ARN of the Terraform production role"
  value       = aws_iam_role.kjl_terraform_prod.arn
}