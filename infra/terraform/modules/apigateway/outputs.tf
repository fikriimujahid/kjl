output "rest_api_id" {
  description = "REST API identifier."
  value       = aws_api_gateway_rest_api.this.id
}

output "rest_api_name" {
  description = "REST API name."
  value       = aws_api_gateway_rest_api.this.name
}

output "rest_api_execution_arn" {
  description = "Execution ARN for the REST API."
  value       = aws_api_gateway_rest_api.this.execution_arn
}

output "stage_name" {
  description = "Deployed API Gateway stage name."
  value       = aws_api_gateway_stage.this.stage_name
}

output "invoke_url" {
  description = "Base invoke URL for the deployed stage."
  value       = aws_api_gateway_stage.this.invoke_url
}

output "access_log_group_name" {
  description = "CloudWatch log group used for API access logs."
  value       = aws_cloudwatch_log_group.api_access.name
}

output "cloudwatch_role_arn" {
  description = "IAM role ARN used by API Gateway to push logs to CloudWatch."
  value       = aws_iam_role.apigw_cloudwatch.arn
}
