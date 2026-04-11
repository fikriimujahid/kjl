# PHASE 1 — PRODUCT & SYSTEM REQUIREMENTS

Project: **KeJepangDulu Web eLearning Platform**
Version: **2.0 (Adjusted Architecture Version)**
Status: **Active**
Depends On: **PHASE 0 — BUSINESS FOUNDATION**
Last Updated: **2026-04-10**

---

# 0. OBJECTIVE

This document defines the **functional and non-functional system requirements** for the KeJepangDulu Web eLearning Platform.

This phase translates **business rules** into **system-level capabilities**.

This system is designed as:

```
Secure Learning Content Delivery Platform
```

NOT:

```
Quiz Processing Engine
```

Quiz behavior is:

```
Content-based viewer (JSON-driven)
```

NOT:

```
Backend scoring engine
```

---

# 1. SYSTEM OVERVIEW

---

## 1.1 System Name

```
system_name: KeJepangDulu Web eLearning Platform
system_type: Serverless Web Application
deployment_model: AWS Serverless
architecture_model: Content Delivery Platform
```

---

## 1.2 System Goals

Primary goals:

```
Replace Google Form delivery
Remove manual approval
Enable automated payment verification
Deliver learning materials securely
Deliver quizzes as structured content
Prevent content piracy
Maintain low AWS operating cost
Support scalable growth
```

---

## 1.3 Core System Philosophy

System behavior:

```
Content-driven
Access-controlled
Payment-validated
Security-first
Low-cost optimized
```

---

# 2. USER ROLES

---

## 2.1 Role Definitions

```
roles:

  guest:

    description:
      Non-registered visitor

  registered_user:

    description:
      Authenticated user
```

---

## 2.2 Role Access Rules

```
access_control:

  guest:

    view_products: true

    view_product_detail: true

    register_account: true

    login: true

    access_dashboard: false

    access_content: false

  registered_user:

    access_dashboard: true

    purchase_product: true

    access_owned_products: true

    access_learning_material:
      requires_product_purchase: true

    access_quiz_content:
      requires_product_purchase: true
```

---

# 3. FUNCTIONAL REQUIREMENTS

---

# 3.1 Authentication Module

---

## 3.1.1 User Registration

```
feature: user_registration

methods:

  email_password: true

  google_login: true

email_verification:

  required: true
```

Inputs:

```
email
password
google_account
```

Outputs:

```
user_account_created
verification_email_sent
```

---

## 3.1.2 Login

```
feature: login

methods:

  email_password

  google_login
```

Outputs:

```
jwt_token
session_started
```

---

## 3.1.3 Logout

```
feature: logout

action:

  invalidate_session: true
```

---

# 3.2 User Dashboard Module

---

## 3.2.1 Dashboard View

```
feature: dashboard

display:

  purchased_products

  recent_accessed_materials

  account_summary
```

---

# 3.3 Product Catalog Module

---

## 3.3.1 Product List

```
feature: product_list

display:

  product_name

  price

  description

  included_material_types
```

---

## 3.3.2 Product Detail

```
feature: product_detail

display:

  product_description

  included_topics

  included_materials
```

---

# 3.4 Purchase System

---

## 3.4.1 Purchase Flow

```
feature: purchase_product

steps:

  select_product

  create_payment_order

  redirect_to_midtrans
```

---

## 3.4.2 Payment Confirmation

```
feature: payment_confirmation

trigger:

  midtrans_webhook
```

Actions:

```
verify_signature
update_payment_status
grant_product_access
store_payment_record
```

---

# 3.5 Learning Material Module

---

## 3.5.1 Material Access

```
feature: learning_material_access

access_rule:

  user must own product
```

Supported types:

```
pdf
image
audio
```

Storage:

```
S3 (private)
```

Delivery:

```
CloudFront Signed URL
```

---

# 3.6 Quiz Content Viewer Module

⚠️ **Important: This is NOT a quiz engine**

---

## 3.6.1 Load Quiz Content

```
feature: load_quiz_content

type: content_viewer
```

Behavior:

```
Load JSON file
Render questions
Display answer options
```

Source:

```
S3 Private Storage
```

Delivery:

```
Signed URL
```

---

## 3.6.2 Quiz Interaction

```
feature: quiz_interaction

type: client_side_only
```

Behavior:

```
Select answers
Navigate questions
Show answers (optional)
```

No backend scoring required.

---

## 3.6.3 Quiz Result Handling

Optional:

```
store_results: optional
location: frontend or DynamoDB (future)
```

Not required for MVP.

---

# 3.7 Profile Management Module

---

## 3.7.1 View Profile

Display:

```
email
display_name
purchased_products
```

---

## 3.7.2 Update Profile

Editable:

```
display_name
```

---

## 3.7.3 Payment History

Display:

```
payment_id
product_name
amount
status
created_at
```

---

# 4. NON-FUNCTIONAL REQUIREMENTS

---

# 4.1 Performance

```
api_response_time:

  target: < 500 ms

page_load_time:

  target: < 3 seconds

initial_concurrent_users:

  target: 200
```

---

# 4.2 Scalability

```
architecture:

  serverless: true

auto_scaling:

  required: true
```

---

# 4.3 Security

```
authentication:

  jwt_required: true

encryption:

  https_required: true

api_protection:

  rate_limiting: enabled

content_security:

  s3_private_access: true

  signed_url_required: true
```

---

# 4.4 Availability

```
uptime_target:

  99.5 percent
```

---

# 4.5 Cost Constraints

```
monthly_budget:

  target: <= 10 USD

alert_threshold:

  80 percent
```

---

# 5. DATA REQUIREMENTS

---

# 5.1 Core Entities

```
entities:

  users

  products

  payments

  user_product_access

  content_metadata
```

---

# 5.2 Content Storage Strategy

```
storage_type: S3 private

delivery: CloudFront signed URLs
```

---

## 5.2.1 Content Path Structure

```
products/{product_slug}/
  topics/{topic_slug}/
    sessions/{session_slug}/
      quiz.json
      images/
      audio/
      pdf/
```

---

# 6. API REQUIREMENTS

---

# 6.1 Authentication APIs

```
POST /auth/register

POST /auth/login

POST /auth/logout
```

---

# 6.2 Product APIs

```
GET /products

GET /products/{productId}
```

---

# 6.3 Material APIs

```
GET /products/{productId}/materials
```

Returns:

```
Signed URLs
Material metadata
```

---

# 6.4 Quiz Content APIs

```
GET /products/{productId}/quiz
```

Returns:

```
Signed URL to quiz.json
```

No processing required.

---

# 6.5 Payment APIs

```
POST /payment/create

POST /payment/webhook
```

---

# 7. USER FLOW REQUIREMENTS

---

# 7.1 Registration Flow

```
Open register page
Enter email
Verify email
Account created
```

---

# 7.2 Purchase Flow

```
Select product
Create payment
Redirect to Midtrans
Payment completed
Webhook received
Grant product access
```

---

# 7.3 Learning Flow

```
User logs in
Open purchased product
Load material list
User selects material
Generate signed URL
Load content
```

---

# 7.4 Quiz Viewing Flow

```
User opens topic
Load quiz JSON
Render questions
User interacts locally
```

---

# 8. ERROR HANDLING REQUIREMENTS

```
invalid_payment:

  message: Payment verification failed

unauthorized_access:

  message: Access denied

missing_content:

  message: Content not found

server_error:

  message: Internal server error
```

---

# 9. AUDIT & LOGGING REQUIREMENTS

Logging required:

```
user_login

payment_events

content_access

security_events
```

Stored in:

```
CloudWatch Logs
```

---

# 10. ACCEPTANCE CRITERIA

System is considered functional when:

```
users_can_register: true

users_can_login: true

users_can_purchase_products: true

payment_webhook_processed: true

materials_accessible_securely: true

quiz_content_loads: true

signed_url_delivery_working: true

manual_approval_removed: true
```

---

# END OF PHASE 1 DOCUMENT
