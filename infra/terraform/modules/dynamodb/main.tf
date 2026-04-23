locals {
  table_definitions = {
    users = {
      hash_key  = "id"
      range_key = null
    }
    products = {
      hash_key  = "id"
      range_key = null
    }
    payments = {
      hash_key  = "id"
      range_key = null
    }
    user_product_access = {
      hash_key  = "user_id"
      range_key = "product_id"
    }
    content_metadata = {
      hash_key  = "content_id"
      range_key = null
    }
  }

  resolved_table_names = {
    for table_name, definition in local.table_definitions : table_name => coalesce(
      lookup(var.table_name_overrides, table_name, null),
      "${var.project_name}-${var.environment}-${table_name}"
    )
  }
}

resource "aws_dynamodb_table" "this" {
  for_each = local.table_definitions

  name         = local.resolved_table_names[each.key]
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = each.value.hash_key
  range_key    = each.value.range_key

  dynamic "attribute" {
    for_each = toset(compact([each.value.hash_key, each.value.range_key]))

    content {
      name = attribute.value
      type = "S"
    }
  }

  server_side_encryption {
    enabled = true
  }

  point_in_time_recovery {
    enabled = var.point_in_time_recovery_enabled
  }

  tags = merge(var.tags, { Table = each.key })
}

data "aws_iam_policy_document" "tables_rw" {
  statement {
    sid    = "DynamoDbReadWriteTables"
    effect = "Allow"

    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:ConditionCheckItem",
      "dynamodb:DeleteItem",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:UpdateItem",
      "dynamodb:DescribeTable"
    ]

    resources = flatten([
      for table in aws_dynamodb_table.this : [
        table.arn,
        "${table.arn}/index/*"
      ]
    ])
  }
}

resource "aws_iam_policy" "tables_rw" {
  count = var.create_iam_policies ? 1 : 0

  name        = "${var.project_name}-${var.environment}-dynamodb-rw"
  description = "Read/write access policy for KeJepangDulu DynamoDB tables."
  policy      = data.aws_iam_policy_document.tables_rw.json
  tags        = var.tags
}

data "aws_iam_policy_document" "tables_ro" {
  statement {
    sid    = "DynamoDbReadOnlyTables"
    effect = "Allow"

    actions = [
      "dynamodb:BatchGetItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:DescribeTable"
    ]

    resources = flatten([
      for table in aws_dynamodb_table.this : [
        table.arn,
        "${table.arn}/index/*"
      ]
    ])
  }
}

resource "aws_iam_policy" "tables_ro" {
  count = var.create_iam_policies ? 1 : 0

  name        = "${var.project_name}-${var.environment}-dynamodb-ro"
  description = "Read-only access policy for KeJepangDulu DynamoDB tables."
  policy      = data.aws_iam_policy_document.tables_ro.json
  tags        = var.tags
}
