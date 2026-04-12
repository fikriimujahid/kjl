output "terraform_dev_role_arn" {
  description = "ARN of the Terraform development role"
  value       = aws_iam_role.kjl_terraform_dev.arn
}