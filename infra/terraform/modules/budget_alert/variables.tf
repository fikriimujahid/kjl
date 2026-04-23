variable "budget_name" {
  description = "AWS budget name."
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget amount in USD."
  type        = number
}

variable "budget_alert_threshold" {
  description = "Budget alert threshold percentage."
  type        = number
}

variable "budget_alert_email" {
  description = "Email for budget alert notifications."
  type        = string
}
