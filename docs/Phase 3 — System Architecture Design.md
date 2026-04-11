# PHASE 3 — SYSTEM ARCHITECTURE DESIGN

Project: **KeJepangDulu Web eLearning Platform**
Version: **2.0 (Content Delivery Architecture)**
Status: **Active**
Depends On:

* Phase 0 — Business Foundation
* Phase 1 — Product & System Requirements
* Phase 2 — Content Strategy & Migration Design

Last Updated: **2026-04-10**

---

# 0. OBJECTIVE

This document defines the **complete system architecture design** for the KeJepangDulu Web eLearning Platform.

This architecture is designed to:

* Deliver learning content securely
* Prevent content piracy
* Automate product access
* Automate payment processing
* Minimize AWS cost
* Support future scalability
* Enable DevSecOps workflows

This system is designed as:

```
Secure Learning Content Delivery Platform
```

NOT:

```
Quiz Processing Engine
```

Quiz is treated as:

```
Static JSON-based content
```

---

# 1. ARCHITECTURE OVERVIEW

---

## 1.1 Architecture Type

```yaml
architecture_type: serverless_content_delivery

cloud_provider: AWS

deployment_model: fully_serverless

frontend_model: static_web_app

backend_model: lightweight_api
```

---

## 1.2 Core AWS Services

```yaml
core_services:

  frontend:

    - S3
    - CloudFront

  backend:

    - API Gateway
    - Lambda

  authentication:

    - Cognito

  database:

    - DynamoDB

  storage:

    - S3 (Private Content)

  dns:

    - Route53

  payment:

    - Midtrans

  monitoring:

    - CloudWatch

  security:

    - IAM
    - WAF (future optional)
```

---

# 2. HIGH-LEVEL SYSTEM ARCHITECTURE

---

## 2.1 System Flow Overview

```text
User Browser
     |
     v
CloudFront CDN
     |
     +------ S3 (Frontend Hosting)
     |
     +------ API Gateway
                 |
                 v
              Lambda
                 |
                 +---- DynamoDB
                 |
                 +---- S3 Private Content
                 |
                 +---- Cognito
                 |
                 +---- Midtrans
```

---

## 2.2 Core System Flow Types

```yaml
request_flows:

  static_frontend:

    source: S3
    cache: CloudFront

  api_request:

    source: API Gateway
    execution: Lambda

  content_access:

    source: S3 Private
    delivery: Signed URL

  authentication:

    provider: Cognito

  payment:

    provider: Midtrans
```

---

# 3. FRONTEND ARCHITECTURE

---

## 3.1 Frontend Technology

```yaml
framework: Next.js

deployment_type: static_export

hosting:

  primary: S3

  delivery: CloudFront
```

---

## 3.2 Frontend Responsibilities

```yaml
frontend_features:

  authentication_ui

  dashboard_ui

  product_catalog

  material_viewer

  quiz_viewer

  profile_management

  payment_interface
```

---

## 3.3 Frontend Hosting Structure

```text
s3_bucket:

kejepangdulu-frontend

structure:

/index.html
/assets/
/css/
/js/
```

---

## 3.4 CDN Configuration

```yaml
cloudfront:

cache_static_assets:

  ttl: 365_days

cache_api:

  ttl: 60_seconds

https_only: true
```

---

# 4. BACKEND ARCHITECTURE

---

## 4.1 API Gateway Configuration

```yaml
api_gateway:

type: REST

endpoint_type: regional

authentication:

  cognito_authorizer: enabled
```

---

## 4.2 Lambda Function Groups

```yaml
lambda_groups:

  auth:

    - register_user
    - login_user

  user:

    - get_dashboard
    - update_profile

  product:

    - list_products
    - get_product_detail

  payment:

    - create_payment
    - payment_webhook

  material:

    - get_material_list

  content:

    - generate_signed_url

  admin:

    - upload_content
    - register_metadata
```

Removed intentionally:

```
No quiz scoring Lambda
No answer processing Lambda
```

---

## 4.3 Lambda Configuration Standards

```yaml
lambda_defaults:

memory: 256MB

timeout: 5_seconds

runtime: Node.js 20.x

logging: enabled
```

---

# 5. DATABASE ARCHITECTURE

---

## 5.1 Database Type

```yaml
database:

type: DynamoDB

mode: On-Demand
```

Chosen for:

```
Low cost
Auto scaling
Serverless operation
```

---

## 5.2 Core Tables

```yaml
tables:

  users

  products

  payments

  user_product_access

  content_metadata
```

---

## 5.3 Users Table

```yaml
table_name: users

partition_key:

  user_id

attributes:

  email

  display_name

  created_at
```

---

## 5.4 Products Table

```yaml
table_name: products

partition_key:

  product_id

attributes:

  product_name

  price

  access_type
```

---

## 5.5 Payments Table

```yaml
table_name: payments

partition_key:

  payment_id

attributes:

  user_id

  product_id

  amount

  status

  created_at
```

---

## 5.6 Access Table

```yaml
table_name: user_product_access

partition_key:

  user_id

sort_key:

  product_id
```

---

## 5.7 Content Metadata Table

```yaml
table_name: content_metadata

partition_key:

  product_id

sort_key:

  session_slug

attributes:

  topic_slug

  question_count

  asset_count

  version
```

---

# 6. STORAGE ARCHITECTURE

---

## 6.1 S3 Buckets

```yaml
buckets:

  frontend_bucket:

    name: kejepangdulu-frontend

  content_bucket:

    name: kejepangdulu-content-private

  backup_bucket:

    name: kejepangdulu-backup
```

---

## 6.2 Content Storage Structure

```text
products/

  product_slug/

    topics/

      topic_slug/

        sessions/

          session_slug/

            quiz.json

            images/

            audio/

            pdf/
```

---

## 6.3 Access Policy

```yaml
bucket_access:

public_access: disabled

delivery_method:

  CloudFront Signed URL
```

---

# 7. AUTHENTICATION ARCHITECTURE

---

## 7.1 Authentication Provider

```yaml
authentication:

provider: AWS Cognito
```

---

## 7.2 Supported Login Methods

```yaml
login_methods:

  email_password

  google_login
```

---

## 7.3 Token Handling

```yaml
token_type: JWT

expiration:

  access_token: 1_hour

  refresh_token: 30_days
```

---

# 8. CONTENT ACCESS ARCHITECTURE

(This is your most important component)

---

## 8.1 Content Access Flow

```text
User Opens Content
        |
        v
API Gateway
        |
        v
Lambda Verify Access
        |
        v
Generate Signed URL
        |
        v
CloudFront → S3 Private Content
```

---

## 8.2 Signed URL Policy

```yaml
url_expiration:

default: 5_minutes
```

---

## 8.3 Access Validation Rules

```yaml
validation_rules:

user_authenticated: required

product_owned: required

content_exists: required
```

---

# 9. PAYMENT ARCHITECTURE

---

## 9.1 Payment Provider

```yaml
provider: Midtrans
```

---

## 9.2 Payment Flow

```text
User Click Purchase
        |
        v
API Gateway
        |
        v
Lambda → Create Order
        |
        v
Midtrans Checkout
        |
        v
Midtrans Webhook
        |
        v
Lambda Verify Signature
        |
        v
Grant Product Access
```

---

## 9.3 Webhook Endpoint

```text
POST /payment/webhook
```

Security:

```yaml
verify_signature: required
```

---

# 10. SECURITY ARCHITECTURE

---

## 10.1 Authentication Security

```yaml
jwt_required: true

token_validation: enabled
```

---

## 10.2 API Security

```yaml
rate_limiting: enabled

cors_policy: restricted
```

---

## 10.3 Content Security

```yaml
s3_private_access: true

signed_urls: enabled
```

---

## 10.4 Encryption

```yaml
in_transit:

  https: required

at_rest:

  dynamodb: enabled

  s3: enabled
```

---

# 11. CACHING ARCHITECTURE

---

## 11.1 CDN Caching

```yaml
static_assets:

ttl: 365_days
```

---

## 11.2 API Caching

```yaml
api_cache:

ttl: 60_seconds
```

---

# 12. MONITORING ARCHITECTURE

---

## 12.1 Logging Services

```yaml
logging:

cloudwatch_logs:

enabled: true
```

---

## 12.2 Metrics Monitoring

```yaml
metrics:

lambda_errors

api_latency

payment_failures
```

---

## 12.3 Cost Monitoring

```yaml
aws_budget:

monthly_limit: 10 USD

alert_threshold: 80_percent
```

---

# 13. NETWORK ARCHITECTURE

---

## 13.1 DNS Configuration

```yaml
dns:

service: Route53
```

---

## 13.2 HTTPS Configuration

```yaml
ssl:

provider: AWS ACM

https_required: true
```

---

# 14. DEPLOYMENT ARCHITECTURE

---

## 14.1 Environment Strategy

```yaml
environments:

  dev

  prod
```

---

## 14.2 Infrastructure as Code

```yaml
iac_tools:

  Terraform

  AWS SAM
```

---

## 14.3 CI/CD Pipeline

```yaml
ci_cd:

tool: GitHub Actions
```

Pipeline stages:

```yaml
build

test

deploy
```

---

# 15. SCALABILITY DESIGN

---

## 15.1 Auto Scaling Model

```yaml
lambda:

auto_scale: enabled

dynamodb:

auto_scale: enabled
```

---

## 15.2 Initial Capacity Target

```yaml
initial_users:

200 concurrent users
```

---

# 16. DISASTER RECOVERY

---

## 16.1 Backup Strategy

```yaml
s3_backup:

enabled: true
```

---

## 16.2 Recovery Targets

```yaml
RTO:

4_hours

RPO:

15_minutes
```

---

# 17. ARCHITECTURE ACCEPTANCE CRITERIA

Architecture is complete when:

```yaml
frontend_served_via_cloudfront: true

api_gateway_connected: true

lambda_functions_deployed: true

database_tables_created: true

cognito_auth_working: true

payment_webhook_operational: true

signed_url_delivery_enabled: true

monitoring_enabled: true
```

---

# END OF PHASE 3 DOCUMENT
