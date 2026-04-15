resource "aws_cloudwatch_log_group" "lambda" {
  for_each = toset(var.lambda_log_group_names)

  name              = each.value
  retention_in_days = var.retention_in_days
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "api_gateway" {
  for_each = toset(var.api_gateway_log_group_names)

  name              = each.value
  retention_in_days = var.retention_in_days
  tags              = var.tags
}
