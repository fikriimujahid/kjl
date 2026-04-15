output "iam_role_arns" {
  description = "IAM roles created by this module."
  value = {
    terraform_execution = aws_iam_role.terraform_execution.arn
    lambda_execution    = aws_iam_role.lambda_execution.arn
    api_gateway         = aws_iam_role.api_gateway.arn
    cloudfront_access   = aws_iam_role.cloudfront_access.arn
  }
}
