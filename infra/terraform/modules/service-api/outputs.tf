output "api_id" {
  description = "ID of the service API Gateway HTTP API."
  value       = module.api_gateway.api_id
}

output "api_endpoint" {
  description = "Base endpoint URL of the service API."
  value       = module.api_gateway.api_endpoint
}

output "api_execution_arn" {
  description = "Execution ARN of the service API."
  value       = module.api_gateway.execution_arn
}

output "api_stage_name" {
  description = "Stage name for the service API."
  value       = module.api_gateway.stage_name
}

output "api_gateway_domain_name" {
  description = "API Gateway domain name without protocol for CloudFront custom origin."
  value       = trimprefix(module.api_gateway.api_endpoint, "https://")
}

output "api_gateway_origin_path" {
  description = "Origin path used by CloudFront when stage is not $default."
  value       = module.api_gateway.stage_name == "$default" ? null : "/${module.api_gateway.stage_name}"
}

output "lambda_function_names" {
  description = "Map of managed Lambda function names keyed by integration key."
  value = {
    for key, lambda_module in module.lambdas : key => lambda_module.lambda_function_name
  }
}

output "lambda_invoke_arns" {
  description = "Map of managed Lambda invoke ARNs keyed by integration key."
  value = {
    for key, lambda_module in module.lambdas : key => lambda_module.invoke_arn
  }
}

output "additional_lambda_function_names" {
  description = "Map of managed Lambda function names (compatibility output)."
  value = {
    for key, lambda_module in module.lambdas : key => lambda_module.lambda_function_name
  }
}

output "additional_lambda_invoke_arns" {
  description = "Map of managed Lambda invoke ARNs (compatibility output)."
  value = {
    for key, lambda_module in module.lambdas : key => lambda_module.invoke_arn
  }
}
