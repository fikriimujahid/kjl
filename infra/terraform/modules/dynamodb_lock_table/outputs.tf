output "table_name" {
  description = "Terraform lock table name."
  value       = var.table_name
}

output "table_arn" {
  description = "Terraform lock table ARN."
  value       = var.create_table ? aws_dynamodb_table.this[0].arn : data.aws_dynamodb_table.existing[0].arn
}
