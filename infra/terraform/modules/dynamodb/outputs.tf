output "table_names" {
  description = "Map of logical table keys to physical table names."
  value = {
    for table_key, table in aws_dynamodb_table.this : table_key => table.name
  }
}

output "table_arns" {
  description = "Map of logical table keys to table ARNs."
  value = {
    for table_key, table in aws_dynamodb_table.this : table_key => table.arn
  }
}

output "read_write_policy_arn" {
  description = "IAM policy ARN for DynamoDB read/write access."
  value       = try(aws_iam_policy.tables_rw[0].arn, null)
}

output "read_only_policy_arn" {
  description = "IAM policy ARN for DynamoDB read-only access."
  value       = try(aws_iam_policy.tables_ro[0].arn, null)
}
