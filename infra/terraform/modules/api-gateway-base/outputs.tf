output "api_id" {
  description = "ID of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.id
}

output "api_endpoint" {
  description = "Base endpoint URL of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.api_endpoint
}

output "execution_arn" {
  description = "Execution ARN of the API Gateway HTTP API."
  value       = aws_apigatewayv2_api.this.execution_arn
}

output "stage_name" {
  description = "Name of the API Gateway stage."
  value       = aws_apigatewayv2_stage.this.name
}

output "stage_invoke_url" {
  description = "Invoke URL for the configured API Gateway stage."
  value       = aws_apigatewayv2_stage.this.invoke_url
}
