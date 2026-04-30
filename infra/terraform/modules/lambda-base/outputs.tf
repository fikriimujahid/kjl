output "lambda_function_name" {
  description = "Name of the Lambda function."
  value       = aws_lambda_function.this.function_name
}

output "lambda_arn" {
  description = "ARN of the Lambda function."
  value       = aws_lambda_function.this.arn
}

output "invoke_arn" {
  description = "Invoke ARN of the Lambda function."
  value       = aws_lambda_function.this.invoke_arn
}

output "qualified_arn" {
  description = "Qualified ARN of the published Lambda version."
  value       = aws_lambda_function.this.qualified_arn
}
