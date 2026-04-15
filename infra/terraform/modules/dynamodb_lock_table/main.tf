resource "aws_dynamodb_table" "this" {
  count = var.create_table ? 1 : 0

  name         = var.table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.tags
}

data "aws_dynamodb_table" "existing" {
  count = var.create_table ? 0 : 1

  name = var.table_name
}
