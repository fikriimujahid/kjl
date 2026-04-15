environment         = "prod"
aws_region          = "ap-southeast-1"
create_state_bucket = false
create_lock_table   = false

monthly_budget_limit   = 10
budget_alert_threshold = 80
budget_alert_email     = "itsmefikri@gmail.com"

lambda_log_group_names = [
  "/aws/lambda/kejepangdulu-prod"
]

api_gateway_log_group_names = [
  "/aws/apigateway/kejepangdulu-prod"
]

# Set explicit IAM principal ARNs if required by your org.
terraform_execution_principal_arns = []

tags = {
  Owner      = "platform-team"
  CostCenter = "kejepangdulu"
}
