# PHASE 5 — BASE INFRASTRUCTURE FOUNDATION

Project: **KeJepangDulu Web eLearning Platform**
Version: **1.0 (Minimal AWS Foundation Version)**
Status: **Active — Planning Baseline**
Depends On: **PHASE 4 — DEVSECOPS FOUNDATION**
Last Updated: **2026-04-11**

---

# 0. OBJECTIVE

This document defines the **minimal AWS infrastructure foundation** required to begin development safely and consistently.

This phase exists to prepare:

* Terraform remote state management
* Basic IAM role boundaries
* Core S3 buckets required by the platform
* Centralized logging foundation
* Cost control foundation

This phase is intentionally limited.

It is designed to provision:

```text
AWS account-level and platform-level foundation only
```

NOT:

```text
Full application infrastructure
```

This phase prepares the AWS base layer before application services are deployed.

---

# 1. SCOPE DEFINITION

---

## 1.1 In Scope

This phase creates only the following:

```yaml
base_infrastructure:

  terraform_state_bucket: true

  terraform_lock_table: true

  iam_roles: true

  content_s3_bucket: true

  frontend_s3_bucket: true

  cloudwatch_logs_foundation: true

  aws_budgets: true
```

---

## 1.2 Out of Scope

This phase must NOT create the following:

```yaml
excluded_for_later_phases:

  api_gateway_routes: true

  lambda_integrations: true

  lambda_functions: true

  dynamodb_application_tables: true

  cognito_user_pool: true

  cloudfront_distribution: true

  route53_records: true

  midtrans_runtime_integration: true

  waf: true
```

These components belong to later implementation phases.

---

## 1.3 Phase Philosophy

This foundation should be:

```text
Minimal
Secure
Reusable
Low-cost
Environment-aware
Terraform-managed
```

Primary goal:

```text
Enable safe development and future infrastructure expansion without overbuilding now
```

---

# 2. TARGET OUTCOME

At the end of this phase, the project must have a working AWS base that supports:

```text
Terraform state storage
Terraform state locking
Secure deployment access via IAM roles
Private content storage
Frontend hosting bucket preparation
Centralized log group structure
Budget monitoring and alerts
```

This base should be sufficient for:

```text
Developer environment bootstrapping
CI/CD infrastructure deployment setup
Future service deployment phases
```

---

# 3. AWS FOUNDATION COMPONENTS

---

## 3.1 Terraform State Bucket

Purpose:

```text
Store Terraform remote state securely
```

Required configuration:

```yaml
resource: s3_bucket
usage: terraform_state

requirements:
  versioning: enabled
  public_access_blocked: true
  encryption: sse_s3_or_sse_kms
  lifecycle_rules: optional
  access_logging: optional_future
```

Naming convention:

```text
kejepangdulu-{environment}-terraform-state
```

Example:

```text
kejepangdulu-dev-terraform-state
kejepangdulu-prod-terraform-state
```

Notes:

```text
This bucket is for infrastructure state only
Application content must never be stored here
```

---

## 3.2 Terraform Lock Table

Purpose:

```text
Prevent concurrent Terraform state modification
```

Required configuration:

```yaml
resource: dynamodb_table
usage: terraform_locking

requirements:
  billing_mode: PAY_PER_REQUEST
  partition_key: LockID
  point_in_time_recovery: optional
```

Naming convention:

```text
kejepangdulu-{environment}-terraform-lock
```

Notes:

```text
Only Terraform locking metadata is stored here
No application data should be added
```

---

## 3.3 IAM Roles Foundation

Purpose:

```text
Establish secure role-based access for CI/CD and operations
```

Initial role set:

```yaml
iam_roles:

  github_actions_deploy_role:
    required: true
    auth_method: github_oidc

  developer_infra_readonly_role:
    required: true
    auth_method: aws_iam

  developer_infra_admin_role:
    optional_recommended: true
    auth_method: aws_iam
```

### 3.3.1 GitHub Actions Deploy Role

Purpose:

```text
Allow GitHub Actions to deploy base infrastructure using OIDC
```

Requirements:

```yaml
role_name: github-actions-deploy-role
assume_role_method: oidc
principal: token.actions.githubusercontent.com
constraints:
  repository_scope_required: true
  branch_or_environment_restriction: recommended
```

Permissions should cover only:

```text
S3 base bucket management
DynamoDB lock table management
CloudWatch log group management
AWS Budgets read/create/update as required
IAM pass and role usage only where strictly needed
```

Principle:

```text
Least privilege only
```

### 3.3.2 Developer Read-Only Role

Purpose:

```text
Allow developers to inspect infrastructure safely without deployment rights
```

Recommended scope:

```text
Read access to S3 bucket metadata
Read access to CloudWatch logs
Read access to budgets
Read access to Terraform-related resources
```

### 3.3.3 Developer Admin Role

Purpose:

```text
Allow limited trusted operators to manage bootstrap resources outside CI/CD when needed
```

Restriction:

```text
Use only for exceptional setup or recovery workflows
```

---

# 4. STORAGE FOUNDATION

---

## 4.1 Content S3 Bucket

Purpose:

```text
Store protected learning content for future secure delivery
```

Required configuration:

```yaml
resource: s3_bucket
usage: private_content_storage

requirements:
  public_access_blocked: true
  versioning: enabled
  encryption: enabled
  bucket_policy: least_privilege
  object_ownership: bucket_owner_enforced
```

Naming convention:

```text
kejepangdulu-{environment}-content
```

Usage boundary:

```text
Prepare the bucket only
Do not yet implement CloudFront signed delivery in this phase
```

Allowed future contents:

```text
Quiz JSON
PDF files
Images
Audio files
```

---

## 4.2 Frontend S3 Bucket

Purpose:

```text
Prepare static frontend hosting bucket for later deployment
```

Required configuration:

```yaml
resource: s3_bucket
usage: frontend_artifact_or_static_hosting

requirements:
  public_access_blocked: true
  encryption: enabled
  versioning: enabled
```

Naming convention:

```text
kejepangdulu-{environment}-frontend
```

Important note:

```text
This phase creates the bucket only
Public website serving and CloudFront integration are deferred
```

---

## 4.3 Backup Consideration

Optional for this phase:

```yaml
backup_bucket:
  create_now: false
  defer_to_later_phase: true
```

Reason:

```text
Minimal infrastructure should avoid expanding storage resources before application deployment needs are confirmed
```

---

# 5. LOGGING FOUNDATION

---

## 5.1 CloudWatch Log Groups

Purpose:

```text
Prepare centralized logging structure for infrastructure and future service integration
```

This phase should create minimal foundational log groups only.

Recommended groups:

```yaml
cloudwatch_log_groups:

  /aws/kejepangdulu/{environment}/infra:
    retention_days: 30

  /aws/kejepangdulu/{environment}/deployments:
    retention_days: 30
```

Use cases:

```text
Infrastructure deployment logging
Bootstrap operation visibility
Future standard naming alignment
```

Important boundary:

```text
Do not create Lambda-specific log groups yet unless a bootstrap process absolutely requires them
```

---

## 5.2 Logging Standards

Required standards:

```yaml
logging_standards:
  log_retention_configured: true
  unbounded_retention: false
  naming_convention_standardized: true
  environment_prefix_required: true
```

Goal:

```text
Avoid uncontrolled logging cost while keeping enough operational traceability
```

---

# 6. COST CONTROL FOUNDATION

---

## 6.1 AWS Budgets

Purpose:

```text
Establish early cost visibility before service expansion
```

Required configuration:

```yaml
aws_budgets:

  overall_monthly_budget:
    required: true
    amount: 10 USD

  alert_thresholds:
    - 50 percent
    - 80 percent
    - 100 percent
```

Recommended notifications:

```yaml
notifications:
  email: required
  sns: optional_future
```

Budget scope:

```text
Entire AWS account or project-tag-filtered budget depending on account strategy
```

---

## 6.2 Cost Tagging Baseline

Recommended mandatory tags for all created resources:

```yaml
required_tags:
  Project: KeJepangDulu
  Environment: dev_or_prod
  ManagedBy: Terraform
  Phase: Phase5
  Owner: platform_team
```

Purpose:

```text
Support future cost attribution and governance
```

---

# 7. ENVIRONMENT STRATEGY

---

## 7.1 Minimum Environments

This phase should support:

```yaml
environments:
  - dev
  - prod
```

Deployment guidance:

```text
Start with dev first
Create prod only after dev validation is complete
```

---

## 7.2 Naming Convention

All resources should follow:

```text
kejepangdulu-{environment}-{resource}
```

Examples:

```text
kejepangdulu-dev-terraform-state
kejepangdulu-dev-terraform-lock
kejepangdulu-dev-content
kejepangdulu-dev-frontend
```

This ensures:

```text
Predictable naming
Environment separation
Lower operational confusion
```

---

# 8. TERRAFORM IMPLEMENTATION GUIDANCE

---

## 8.1 Management Model

Infrastructure in this phase should be managed using:

```yaml
iac:
  primary_tool: Terraform
  execution_model: modular_recommended
```

Suggested minimal module grouping:

```text
bootstrap-state
bootstrap-iam
bootstrap-storage
bootstrap-logging
bootstrap-budget
```

---

## 8.2 Terraform Backend Strategy

Bootstrap sequence:

```text
Step 1 — Create state bucket and lock table using local state

Step 2 — Reconfigure Terraform to use remote backend

Step 3 — Deploy remaining base infrastructure using remote state
```

Important note:

```text
Remote backend cannot be used before its own storage resources exist
```

---

## 8.3 State Separation

Recommended:

```yaml
terraform_state_layout:
  bootstrap_state: separate
  application_state: separate_future
```

Reason:

```text
Bootstrap resources should remain isolated from future application stacks
```

---

# 9. SECURITY BASELINE

---

## 9.1 S3 Security Requirements

All S3 buckets in this phase must have:

```yaml
s3_security:
  block_public_access: true
  server_side_encryption: true
  enforce_tls: true
  bucket_owner_enforced: true
```

---

## 9.2 IAM Security Requirements

All IAM configurations in this phase must follow:

```yaml
iam_security:
  least_privilege: true
  wildcard_permissions: avoid
  oidc_for_github_actions: required
  long_lived_access_keys: prohibited
```

---

## 9.3 Auditability

Base resources should be traceable by:

```text
Terraform state
CloudWatch logging where applicable
AWS resource tags
GitHub Actions deployment history
```

---

# 10. PHASE BOUNDARIES AND DEFERRED WORK

This phase intentionally does NOT build runtime application architecture.

Deferred to later phases:

```text
API Gateway resource tree
Lambda functions and integrations
Cognito configuration
DynamoDB application data tables
CloudFront distributions
Custom domain routing
Signed URL implementation
Payment runtime integration
Full monitoring dashboards and alarms
```

Reason:

```text
The objective here is to establish the minimum secure AWS base without prematurely committing to service-level implementation details
```

---

# 11. DELIVERY SEQUENCE

Recommended execution order:

```text
1. Create Terraform state bucket
2. Create Terraform lock table
3. Switch Terraform backend to remote state
4. Create IAM deployment role and operator roles
5. Create content S3 bucket
6. Create frontend S3 bucket
7. Create CloudWatch log groups
8. Create AWS Budgets and notifications
9. Validate tags, encryption, and access policies
```

---

# 12. ACCEPTANCE CRITERIA

Phase 5 is complete when:

```yaml
terraform_state_bucket_created: true
terraform_state_bucket_versioning_enabled: true
terraform_lock_table_created: true
remote_state_ready: true
github_oidc_deploy_role_created: true
operator_roles_created: true
content_bucket_created_private: true
frontend_bucket_created: true
cloudwatch_log_groups_created: true
budget_created: true
budget_alerts_configured: true
resource_tags_applied: true
no_api_gateway_routes_created: true
no_lambda_integrations_created: true
```

---

# 13. OUTPUT ARTIFACTS

This phase should produce:

```text
terraform/bootstrap/
terraform.tfvars.example
backend configuration template
IAM role policy documents
budget notification configuration
bootstrap deployment README
```

---

# 14. RECOMMENDED NEXT PHASE

After this phase is complete, the next implementation layer should focus on:

```text
Core application infrastructure
```

That later phase may include:

```text
API Gateway base setup
Lambda service deployment foundation
DynamoDB application tables
Cognito setup
CloudFront integration
```

These are intentionally excluded from Phase 5.

---

# END OF PHASE 5 DOCUMENT
