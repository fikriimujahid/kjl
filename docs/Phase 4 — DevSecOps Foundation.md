# PHASE 4 — DEVSECOPS FOUNDATION (MONOREPO)

Project: **KeJepangDulu Web eLearning Platform**
Version: **1.0 (Monorepo Strategy)**
Status: **Active — Execution Starting Phase**
Depends On:

* Phase 0 — Business Foundation
* Phase 1 — Product & System Requirements
* Phase 2 — Content Strategy
* Phase 3 — System Architecture

Last Updated: **2026-04-10**

---

# 0. OBJECTIVE

This phase establishes the **development, security, and deployment foundation** using a **monorepo architecture**.

This phase ensures:

* Version-controlled infrastructure
* Secure development workflows
* Automated deployment pipelines
* Consistent code standards
* Controlled access management
* Future scalability readiness

This phase enables:

```text
Safe Development
Secure Deployment
Reliable Infrastructure
```

Without this phase:

```text
System instability risk increases
Security risk increases
Deployment complexity increases
```

---

# 1. MONOREPO STRATEGY

---

## 1.1 Monorepo Philosophy

All system components are stored inside:

```text
Single Git Repository
```

Benefits:

```text
Shared configurations
Centralized version control
Simplified CI/CD
Reduced duplication
Better dependency control
```

---

## 1.2 Repository Name

```text
kejepangdulu-platform
```

---

## 1.3 Repository Structure

```text
kejepangdulu-platform/

├── apps/
│   ├── web/
│   │   (Next.js frontend)
│   │
│   ├── api/
│   │   (Lambda services)
│
├── packages/
│   ├── ui/
│   │   (Shared UI components)
│   │
│   ├── config/
│   │   (Shared configs)
│   │
│   ├── types/
│   │   (Shared TypeScript types)
│
├── infrastructure/
│   ├── terraform/
│   │
│   ├── sam/
│
├── scripts/
│
├── docs/
│
├── .github/
│   ├── workflows/
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

Recommended tools:

```text
pnpm
Turborepo
TypeScript
```

---

# 2. VERSION CONTROL STRATEGY

---

## 2.1 Git Provider

```text
GitHub
```

Recommended:

```text
GitHub Organization
```

Example:

```text
kejepangdulu-org
```

---

## 2.2 Branch Strategy

```text
main → production

dev → integration

feature/* → development

hotfix/* → urgent fixes
```

---

## 2.3 Branch Protection Rules

Protect:

```text
main
dev
```

Rules:

```text
Require pull request
Require code review
Require CI passing
Block direct push
```

---

# 3. DEVELOPMENT TOOLCHAIN

---

## 3.1 Core Development Stack

```text
Node.js 20.x

TypeScript

Next.js

AWS SDK v3
```

---

## 3.2 Package Manager

Recommended:

```text
pnpm
```

Reason:

```text
Faster installs
Better monorepo support
Lower disk usage
```

---

## 3.3 Build System

Recommended:

```text
Turborepo
```

Purpose:

```text
Parallel builds
Caching
Dependency tracking
```

---

# 4. SECURITY FOUNDATIONS

---

## 4.1 Repository Security

Enable:

```text
Dependabot

Secret scanning

Code scanning

Dependency review
```

---

## 4.2 Secrets Management Strategy

Two layers:

```text
GitHub Secrets
AWS Secrets Manager
```

Stored secrets:

```text
AWS_ACCESS_KEY_ID

AWS_SECRET_ACCESS_KEY

MIDTRANS_SERVER_KEY

COGNITO_CLIENT_SECRET

JWT_SECRET
```

Never store secrets in:

```text
Source code
Environment files in repo
```

---

## 4.3 IAM Role Strategy

Roles:

```text
developer-role

ci-cd-role

terraform-role

lambda-role
```

Principle:

```text
Least Privilege
```

---

# 5. MONOREPO APPLICATION STRUCTURE

---

# 5.1 Frontend Application

Location:

```text
apps/web/
```

Stack:

```text
Next.js

React

TypeScript
```

Responsibilities:

```text
Authentication UI

Dashboard UI

Product Viewer

Material Viewer

Quiz Viewer

Payment Interface
```

---

# 5.2 Backend API

Location:

```text
apps/api/
```

Stack:

```text
Node.js

AWS Lambda

TypeScript
```

Lambda groups:

```text
auth/

product/

payment/

material/

content/
```

No heavy quiz logic.

---

# 5.3 Shared Packages

Location:

```text
packages/
```

Modules:

```text
ui/

types/

config/
```

Shared usage:

```text
Frontend + Backend
```

---

# 6. INFRASTRUCTURE CODE STRUCTURE

---

Location:

```text
infrastructure/
```

Contains:

```text
terraform/

sam/
```

---

## 6.1 Terraform Modules

```text
modules/

s3/

dynamodb/

cloudfront/

cognito/

route53/

iam/
```

---

## 6.2 Terraform Environments

```text
environments/

dev/

prod/
```

---

## 6.3 Terraform State Management

```text
Backend: S3

Locking: DynamoDB
```

---

# 7. CI/CD PIPELINE DESIGN

---

## 7.1 GitHub Actions Workflow

Location:

```text
.github/workflows/
```

Required workflows:

```text
ci.yml

deploy-dev.yml

deploy-prod.yml
```

---

## 7.2 CI Pipeline Steps

```text
Install dependencies

Lint code

Run tests

Build project

Validate infrastructure
```

---

## 7.3 Deployment Pipeline Steps

```text
Terraform Plan

Terraform Apply

SAM Build

SAM Deploy
```

---

## 7.4 Deployment Triggers

```text
Push to dev → Deploy Dev

Push to main → Deploy Production
```

---

# 8. CODE QUALITY ENFORCEMENT

---

## 8.1 Linting

Tool:

```text
ESLint
```

---

## 8.2 Formatting

Tool:

```text
Prettier
```

---

## 8.3 Type Checking

Tool:

```text
TypeScript
```

---

## 8.4 Pre-Commit Hooks

Tool:

```text
Husky
```

Checks:

```text
Lint

Format

Type-check
```

---

# 9. DEVELOPMENT ENVIRONMENT SETUP

---

## 9.1 Local Development Requirements

Required tools:

```text
Node.js 20+

pnpm

Docker (optional)

AWS CLI

Git
```

---

## 9.2 Local Environment Variables

Stored in:

```text
.env.local
```

Never committed to Git.

---

# 10. TESTING FRAMEWORK SETUP

---

## 10.1 Unit Testing

Tool:

```text
Vitest
```

---

## 10.2 API Testing

Tool:

```text
Supertest
```

---

## 10.3 Frontend Testing

Tool:

```text
Playwright (future)
```

---

# 11. DOCUMENTATION STRATEGY

---

Location:

```text
docs/
```

Required documents:

```text
architecture.md

api-spec.md

deployment-guide.md

runbook.md
```

---

# 12. ENVIRONMENT STRATEGY

---

## 12.1 Development Environment

```text
dev
```

Used for:

```text
Testing new features
```

---

## 12.2 Production Environment

```text
prod
```

Used for:

```text
Live users
```

---

# 13. SECURITY BASELINE CHECKLIST

Before moving to Phase 5:

```text
GitHub organization created

Repository created

Branch protection enabled

Secrets configured

IAM roles defined

CI/CD pipelines created

Security scanning enabled
```

All must be:

```text
Completed
```

---

# 14. DEVSECOPS ACCEPTANCE CRITERIA

Phase is complete when:

```text
Monorepo initialized

Frontend skeleton created

Backend skeleton created

Infrastructure repo initialized

GitHub Actions working

Secrets stored securely

Branch protection enabled

CI pipeline passing
```

---

# END OF PHASE 4 DOCUMENT
