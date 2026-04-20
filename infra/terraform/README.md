## Usage

### 1) Dev workflow
```bash
terraform init -backend-config backend-dev.hcl
terraform plan -var-file dev.tfvars
terraform apply -var-file dev.tfvars
```

### 3) Prod workflow

```bash
# Update bucket value in backend-prod.hcl with your real AWS account ID first.
terraform init -backend-config backend-prod.hcl
terraform plan -var-file prod.tfvars
terraform apply -var-file prod.tfvars
```

## Optional configuration

- `domain_name`
  - Required hostname that will be attached to CloudFront and published in Route53.
  - Set this to the exact frontend hostname you want to serve, for example `app.example.com`.

- `zone_id`
  - Required Route53 hosted zone ID that owns `domain_name`.
  - Used for both ACM DNS validation and the CloudFront alias record.

- `log_groups`
  - Map of CloudWatch log group names to retention settings.
  - Example:
    ```hcl
    log_groups = {
      "/aws/lambda/kejepangdulu-dev" = {
        retention_in_days = 14
      }
      "/aws/apigateway/kejepangdulu-dev" = {
        retention_in_days = 30
      }
    }
    ```

- `terraform_execution_principal_arns`
  - Defaults to account root principal when empty.
  - Set explicit CI/CD principal ARNs for stricter role assumption.
- `cloudfront_origin_bucket_arns`
  - Optional S3 bucket ARNs to grant read access to `cloudfront-access-role`.
  - Left empty by default so no extra S3 access is granted.

## Hosting composition

- The root module now composes static hosting through `modules/hosting`.
- That module provisions the frontend S3 bucket, ACM certificate in `us-east-1`, CloudFront distribution, and Route53 alias record.
- Replace the example values in `dev.tfvars` and `prod.tfvars` before running `plan` or `apply`.
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
