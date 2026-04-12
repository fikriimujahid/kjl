# PHASE 4 — DEVSECOPS FOUNDATION

Project: **KeJepangDulu Web eLearning Platform**
Version: **2.0 (Monorepo + OIDC Architecture)**
Status: **Active — Execution Phase**
Depends On: **PHASE 3 — System Architecture Design**
Last Updated: **2026-04-10**

---

# 0. OBJECTIVE

This phase establishes the **secure development and deployment foundation**.

It ensures:

* Secure CI/CD pipeline
* No static AWS credentials
* Infrastructure automation
* Code standardization
* Security-first workflow
* Team scalability
* Deployment consistency

Authentication method:

```text
GitHub → AWS via OIDC (OpenID Connect)
```

NOT:

```text
AWS_ACCESS_KEY in GitHub Secrets
```

---

# 1. DEVSECOPS ARCHITECTURE OVERVIEW

---

## 1.1 High-Level DevSecOps Flow

```text
Developer Push Code
        |
        v
GitHub Repository (Monorepo)
        |
        v
GitHub Actions Workflow
        |
        v
OIDC Authentication
        |
        v
Assume AWS Role
        |
        v
Deploy Infrastructure / Services
```

---

## 1.2 Core DevSecOps Components

```yaml
devsecops_components:

  source_control:

    GitHub

  ci_cd:

    GitHub Actions

  authentication:

    AWS OIDC Federation

  infrastructure:

    Terraform

  application:

    AWS SAM

  security:

    IAM Roles

  secrets:

    AWS Secrets Manager

  logging:

    CloudWatch
```

---

# 2. MONOREPO STRATEGY

---

## 2.1 Monorepo Philosophy

All components live in:

```text
single repository
```

Advantages:

```text
Centralized version control
Shared dependencies
Simplified CI/CD
Better traceability
Consistent deployment
```

---

## 2.2 Monorepo Root Structure

```text
kejepangdulu-platform/

├── apps/
│   ├── frontend/
│   ├── backend-api/
│   └── admin-tools/
│
├── services/
│   ├── auth/
│   ├── payment/
│   ├── product/
│   ├── content/
│   └── user/
│
├── infrastructure/
│   ├── terraform/
│   ├── sam/
│   └── scripts/
│
├── shared/
│   ├── types/
│   ├── utils/
│   └── constants/
│
├── docs/
│   ├── phase0/
│   ├── phase1/
│   ├── phase2/
│   ├── phase3/
│   └── phase4/
│
├── .github/
│   └── workflows/
│
├── package.json
├── README.md
└── .gitignore
```

---

# 3. BRANCH STRATEGY

---

## 3.1 Branch Model

```text
main      → production

dev       → integration

feature/* → feature development
```

---

## 3.2 Branch Protection Rules

Protected branches:

```text
main
dev
```

Rules:

```text
Require pull request
Require status checks
Require code review
Block force push
```

---

# 4. GITHUB ORGANIZATION SETUP

---

## 4.1 Organization Name

Recommended:

```text
kejepangdulu
```

---

## 4.2 Repository Name

```text
kejepangdulu-platform
```

Monorepo model:

```text
Single repository only
```

---

# 5. GITHUB SECURITY CONFIGURATION

---

## 5.1 Enable Security Features

Required:

```text
Dependabot

Secret scanning

Code scanning

Dependency alerts
```

---

## 5.2 Enable Dependabot

Purpose:

```text
Auto update dependencies
Fix security vulnerabilities
```

---

# 6. AWS OIDC AUTHENTICATION SETUP

(VERY IMPORTANT SECTION)

---

## 6.1 Why OIDC?

Benefits:

```text
No AWS access keys

Short-lived credentials

Automatic credential rotation

Better security

Industry standard
```

---

## 6.2 Create OIDC Identity Provider

AWS:

```text
IAM → Identity Providers
```

Provider:

```text
token.actions.githubusercontent.com
```

Audience:

```text
sts.amazonaws.com
```

---

## 6.3 Create AWS OIDC Role

Role name:

```text
github-actions-deploy-role
```

Trust policy:

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated":
      "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud":
        "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub":
        "repo:kejepangdulu/*"
    }
  }
}
```

---

## 6.4 Attach Permissions to Role

Required policies:

```text
Terraform deployment permissions

SAM deployment permissions

CloudWatch permissions

S3 permissions
```

Use:

```text
Least Privilege Principle
```

---

# 7. CI/CD PIPELINE DESIGN

---

## 7.1 Workflow Types

Required:

```text
lint

test

build

deploy-dev

deploy-prod
```

---

## 7.2 CI Workflow Flow

```text
Push Code
    ↓
Run Lint
    ↓
Run Tests
    ↓
Build Project
    ↓
Deploy Infrastructure
    ↓
Deploy Services
```

---

# 7.3 Deployment Triggers

```text
dev branch → deploy DEV

main branch → deploy PROD
```

---

# 8. ENVIRONMENT STRATEGY

---

## 8.1 Environments

```text
dev
prod
```

Later optional:

```text
staging
```

---

## 8.2 Environment Naming Convention

```text
project-environment-resource
```

Example:

```text
kejepangdulu-dev-content-bucket

kejepangdulu-prod-users-table
```

---

# 9. SECRETS MANAGEMENT

---

## 9.1 Secret Storage Location

Use:

```text
AWS Secrets Manager
```

---

## 9.2 Required Secrets

```text
MIDTRANS_SERVER_KEY

COGNITO_CLIENT_SECRET

JWT_SECRET
```

---

## 9.3 Environment Variables

```text
NODE_ENV

API_BASE_URL

CONTENT_BUCKET_NAME
```

---

# 10. IAM ROLE STRATEGY

---

## 10.1 Role Types

```text
github-actions-role

developer-role

admin-role
```

---

## 10.2 IAM Principles

```text
Least privilege

Role separation

Audit logging
```

---

# 11. CODE QUALITY STANDARDS

---

## 11.1 Linting

Use:

```text
ESLint
Prettier
```

---

## 11.2 Formatting

Automatic formatting required.

---

## 11.3 Testing Framework

Recommended:

```text
Jest
```

---

# 12. MONITORING INTEGRATION

---

## 12.1 Logging

```text
GitHub Logs

CloudWatch Logs
```

---

## 12.2 Alerts

Configure:

```text
Deployment failure alerts
```

---

# 13. DEVSECOPS ACCEPTANCE CRITERIA

Phase is complete when:

```yaml
repository_created: true

monorepo_structure_ready: true

branch_protection_enabled: true

oidc_configured: true

github_actions_workflow_created: true

deployment_role_created: true

ci_cd_pipeline_working: true
```

---

# END OF PHASE 4 DOCUMENT
