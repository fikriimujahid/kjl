output "cicd_runner_role_arn" {
  description = "ARN of the GitHub Actions CI/CD runner role"
  value       = aws_iam_role.cicd_runner.arn
}