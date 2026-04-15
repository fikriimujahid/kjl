environment         = "dev"
aws_region          = "ap-southeast-1"
create_state_bucket = true
create_lock_table   = true

monthly_budget_limit   = 10
budget_alert_threshold = 80
budget_alert_email     = "itsmefikri@gmail.com"

lambda_log_group_names = [
  "/aws/lambda/kejepangdulu-dev"
]

api_gateway_log_group_names = [
  "/aws/apigateway/kejepangdulu-dev"
]

# Set explicit IAM principal ARNs if required by your org.
terraform_execution_principal_arns = []

tags = {
  Owner      = "platform-team"
  CostCenter = "kejepangdulu"
}
