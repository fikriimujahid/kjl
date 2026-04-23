resource "aws_cloudwatch_log_group" "this" {
  for_each = var.log_groups

  name              = each.key
  retention_in_days = each.value.retention_in_days
  tags              = var.tags
}