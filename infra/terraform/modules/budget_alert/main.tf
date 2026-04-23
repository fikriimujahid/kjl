data "aws_caller_identity" "current" {}

resource "aws_budgets_budget" "this" {
  name         = var.budget_name
  account_id   = data.aws_caller_identity.current.account_id
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_limit)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "ACTUAL"
    threshold                  = var.budget_alert_threshold
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.budget_alert_email]
  }
}
