# Terraform Bootstrap Foundation

This directory contains the Terraform bootstrap layer for KeJepangDulu.

It provisions only foundation infrastructure (no application resources):

- Remote Terraform state backend foundation
  - S3 bucket: `terraform-state-<aws_account_id>`
  - State key prefix output: `terraform-state-<aws_account_id>/<project_name>-<environment>`
  - Versioning enabled
  - SSE-S3 encryption enabled
  - Public access fully blocked
- Terraform lock table
  - DynamoDB table: `kejepangdulu-{environment}-terraform-lock`
  - Partition key: `LockID` (string)
- IAM roles (least privilege baseline)
  - `kejepangdulu-{environment}-terraform-execution-role`
  - `kejepangdulu-{environment}-lambda-execution-role`
  - `kejepangdulu-{environment}-api-gateway-role`
  - `kejepangdulu-{environment}-cloudfront-access-role`
- CloudWatch logging foundation
  - Lambda log group prefix resources (`/aws/lambda/*` style naming)
  - API Gateway log group prefix resources (`/aws/apigateway/*` style naming)
  - 30-day retention (default)
- AWS budget alerting
  - Monthly budget: USD 20
  - Alert threshold: 80%
  - Notification email: `ops@example.com`

## Structure

- Root module: environment-specific entrypoint and provider wiring
- Reusable single-service modules:
  - `modules/s3_state_backend`
  - `modules/dynamodb_lock_table`
  - `modules/iam_bootstrap_roles`
  - `modules/cloudwatch_logging`
  - `modules/budget_alert`
- Environment values: `dev.tfvars`, `prod.tfvars`
- Backend config: `backend-dev.hcl`, `backend-prod.hcl`

## Prerequisites

- Terraform `>= 1.5.0`
- AWS credentials with permissions to create:
  - S3, DynamoDB, IAM, CloudWatch Logs, AWS Budgets

## Important backend bootstrapping workflow

Because this root module contains an S3 backend block in [backend.tf](backend.tf), Terraform plan/apply requires backend initialization.

Running terraform init -backend=false only initializes providers/modules. It does not allow plan/apply while an S3 backend is configured.

Use one of the following patterns:

1. Existing state bucket (recommended): set create_state_bucket = false, then run terraform init -reconfigure -backend-config backend-dev.hcl and continue with plan/apply.
2. First-time bootstrap in same root: temporarily disable [backend.tf](backend.tf), run local init/plan/apply to create bucket and bootstrap resources, then restore [backend.tf](backend.tf) and run terraform init -migrate-state -backend-config backend-dev.hcl.

This repository currently uses `use_lockfile = true` in backend config files, so Terraform state locking is handled by S3 lockfile.

## Usage

### 1) Dev workflow when backend bucket already exists

```bash
terraform init -reconfigure -backend-config backend-dev.hcl
terraform plan -var-file dev.tfvars
terraform apply -var-file dev.tfvars
```

### 2) Dev first-time bootstrap when bucket does not exist yet

Temporarily move [backend.tf](backend.tf) out of the folder, then run:

```bash
terraform init
terraform plan -var-file dev.tfvars
terraform apply -var-file dev.tfvars
```

Restore [backend.tf](backend.tf), then switch to remote backend:

```bash
terraform init -migrate-state -backend-config backend-dev.hcl
```

After migration, continue normally:

```bash
terraform plan -var-file dev.tfvars
```

### 3) Prod workflow

```bash
# Update bucket value in backend-prod.hcl with your real AWS account ID first.
terraform init -reconfigure -backend-config backend-prod.hcl
terraform plan -var-file prod.tfvars
terraform apply -var-file prod.tfvars
```

## Reuse single-service modules

Example: use only the S3 state backend module.

```hcl
module "state_backend" {
  source      = "../modules/s3_state_backend"
  bucket_name = "terraform-state-123456789012"
  create_bucket = false
  tags = {
    Project     = "kejepangdulu"
    Environment = "dev"
    ManagedBy   = "Terraform"
  }
}
```

Example: use only the lock table module.

```hcl
module "lock_table" {
  source     = "../modules/dynamodb_lock_table"
  table_name = "kejepangdulu-dev-terraform-lock"
}
```

## Optional configuration

- `create_state_bucket`
  - If `true`, creates `terraform-state-<aws_account_id>`.
  - If `false`, uses existing `terraform-state-<aws_account_id>` bucket.

- `terraform_execution_principal_arns`
  - Defaults to account root principal when empty.
  - Set explicit CI/CD principal ARNs for stricter role assumption.
- `cloudfront_origin_bucket_arns`
  - Optional S3 bucket ARNs to grant read access to `cloudfront-access-role`.
  - Left empty by default so no extra S3 access is granted.
- `lambda_log_group_names` and `api_gateway_log_group_names`
  - Set explicit log group names in `dev.tfvars` and `prod.tfvars`.

## Security notes

- Encryption is enabled for S3 state bucket and DynamoDB lock table.
- S3 backend bucket denies non-TLS access.
- Public access to S3 state bucket is fully blocked.
- IAM policies are scoped to bootstrap use cases and prefixed resources.

## Commands

```bash
terraform fmt -recursive
terraform validate
```
