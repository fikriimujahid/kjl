output "lambda_log_group_names" {
  description = "Lambda log groups created by this module."
  value       = sort([for log_group in aws_cloudwatch_log_group.lambda : log_group.name])
}

output "api_gateway_log_group_names" {
  description = "API Gateway log groups created by this module."
  value       = sort([for log_group in aws_cloudwatch_log_group.api_gateway : log_group.name])
}
