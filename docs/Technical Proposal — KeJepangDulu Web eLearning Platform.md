# TECHNICAL PROPOSAL — KeJepangDulu Web eLearning Platform

**Document Type:** Technical Proposal
**Project:** KeJepangDulu Web eLearning Platform
**Version:** 1.0
**Status:** Final Draft
**Classification:** Internal — Technical Review
**Prepared For:** Enterprise Stakeholders / Technical Review Board
**Date:** 2026-04-14

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Understanding of Requirements](#2-understanding-of-requirements)
3. [Proposed System Architecture](#3-proposed-system-architecture)
4. [Data Flow Architecture](#4-data-flow-architecture)
5. [Role-Based Access Control Model](#5-role-based-access-control-model)
6. [Environment & Deployment Architecture](#6-environment--deployment-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Hosting Infrastructure](#8-hosting-infrastructure)
9. [Scalability and Performance Strategy](#9-scalability-and-performance-strategy)
10. [Workflow Implementation](#10-workflow-implementation)
11. [Content Management Strategy](#11-content-management-strategy)
12. [Integration Architecture](#12-integration-architecture)
13. [Data Management and Reporting](#13-data-management-and-reporting)
14. [UI/UX Strategy](#14-uiux-strategy)
15. [Migration Strategy](#15-migration-strategy)
16. [Testing Strategy](#16-testing-strategy)
17. [Phased Delivery Plan](#17-phased-delivery-plan)
18. [Project Governance](#18-project-governance)
19. [Maintenance and Support Model](#19-maintenance-and-support-model)

---

# 1. Executive Summary

## 1.1 Project Purpose

This Technical Proposal outlines the architecture, design, and implementation strategy for the **KeJepangDulu Web eLearning Platform** — a cloud-native, serverless web application designed to replace the existing manual, fragmented learning content delivery system with a secure, automated, and scalable digital platform.

The current KeJepangDulu operation relies on a combination of Google Forms for quiz delivery, Google Drive for material distribution, WhatsApp for user support, and manual payment approval workflows. This model imposes significant operational overhead, introduces content piracy risk, and fundamentally limits the business's ability to scale.

## 1.2 Platform Vision

The proposed platform is architected as a **Secure Learning Content Delivery Platform** — not a quiz processing engine. All learning content, including quizzes, is treated as structured, static JSON-driven content delivered securely through signed URLs. This architectural philosophy minimises backend complexity, reduces compute cost, and ensures content protection.

## 1.3 Key Benefits

| Benefit | Description |
|---|---|
| **Automated Payment Processing** | Eliminates manual payment approval through webhook-based Midtrans integration |
| **Content Security** | All learning materials stored privately with CloudFront Signed URL delivery |
| **Operational Cost Efficiency** | Fully serverless architecture targeting ≤ USD 10/month operational cost |
| **Scalability** | Auto-scaling compute and database layers supporting 200+ concurrent users at launch |
| **Anti-Piracy** | No public JSON access, no direct download links, URL expiration, and access-controlled delivery |
| **Zero Manual Overhead** | Automated registration, payment, access granting, and content delivery |

## 1.4 Technology Direction

The platform adopts a fully serverless, cloud-native architecture on Amazon Web Services (AWS). Core technology decisions include:

- **Frontend:** Next.js static export hosted on S3, delivered via CloudFront CDN
- **Backend:** AWS Lambda functions behind API Gateway (REST)
- **Authentication:** AWS Cognito with JWT-based session management
- **Database:** Amazon DynamoDB in on-demand capacity mode
- **Storage:** Amazon S3 private buckets with CloudFront Signed URL delivery
- **Infrastructure as Code:** Terraform for infrastructure provisioning
- **CI/CD:** GitHub Actions for build, test, and deployment pipelines
- **Payment:** Midtrans payment gateway with webhook-based verification

## 1.5 Business Value

The platform directly addresses the following business outcomes:

- **Month 1:** 100 registered users, IDR 2,000,000 revenue target
- **Month 3:** 500 registered users, IDR 10,000,000 revenue target
- **Month 6:** 2,000 registered users, IDR 50,000,000 revenue target
- **AWS Budget Ceiling:** USD 20/month with 80% alert threshold

## 1.6 Scalability Goals

The architecture is designed to scale from a small initial user base to thousands of concurrent users without infrastructure re-architecture. Serverless compute (Lambda), auto-scaling database (DynamoDB on-demand), and CDN-based content delivery (CloudFront) ensure that cost scales linearly with usage and that no provisioning bottlenecks exist.

---

# 2. Understanding of Requirements

## 2.1 Business Context

### 2.1.1 Business Problem

KeJepangDulu currently operates a Japanese language learning business that delivers educational content — including practice quizzes, study materials, audio, images, and PDFs — through a manually-managed ecosystem of Google Forms, Google Drive, and WhatsApp. Payment approval is manually performed after users complete transactions via third-party payment links.

This model introduces the following critical business risks:

1. **Operational Bottleneck:** Manual payment verification and content access granting creates a single point of failure dependent on human availability.
2. **Content Piracy Exposure:** All materials delivered through Google Forms and Google Drive are susceptible to unauthorised sharing and redistribution.
3. **Scalability Ceiling:** The manual model cannot sustain growth beyond a small user base without proportional increase in operational labour.
4. **User Experience Degradation:** Users experience delays between payment and access, fragmented learning interfaces across multiple platforms, and inconsistent content presentation.
5. **Revenue Leakage:** Absence of centralised payment tracking and automated access control introduces risk of revenue loss through missed verifications.

### 2.1.2 Target Users

The platform serves Indonesian learners preparing for the Japanese-Language Proficiency Test (JLPT) and the Japan Foundation Test (JFT). The primary user demographic consists of individuals preparing for language certification, often as a prerequisite for work or study opportunities in Japan.

Users are price-sensitive (products range from IDR 5,000 to IDR 40,000), mobile-first, and expect immediate access upon payment completion. The platform must accommodate users with varying levels of technical literacy.

### 2.1.3 Platform Goals

The platform shall:

1. Replace all Google Form-based quiz delivery with a structured, web-based content viewer
2. Replace all Google Drive-based material delivery with secure, signed-URL-protected content access
3. Automate payment verification through Midtrans webhook integration
4. Eliminate manual payment approval entirely
5. Deliver all content through a single, unified web application
6. Protect all intellectual property through private storage and access-controlled delivery
7. Maintain operational costs at or below USD 10/month for normal operations

## 2.2 Platform Objectives

### 2.2.1 Functional Goals

| ID | Objective | Description |
|---|---|---|
| FG-01 | User Registration | Support email/password and Google OAuth registration with email verification |
| FG-02 | User Authentication | JWT-based authentication with access and refresh token management |
| FG-03 | Product Catalog | Public-facing product listing and detail pages |
| FG-04 | Payment Processing | Automated Midtrans payment creation and webhook-based verification |
| FG-05 | Content Delivery | Secure delivery of quiz JSON, PDF, image, and audio content via Signed URLs |
| FG-06 | Quiz Viewing | Client-side quiz rendering from structured JSON — no backend scoring |
| FG-07 | User Dashboard | Display purchased products, recently accessed materials, and account summary |
| FG-08 | Profile Management | View and update display name, view payment history |
| FG-09 | Content Administration | Upload content and register metadata through administrative endpoints |

### 2.2.2 User Experience Goals

| ID | Objective | Target |
|---|---|---|
| UX-01 | Page Load Time | < 3 seconds |
| UX-02 | API Response Time | < 500 milliseconds |
| UX-03 | Content Load Time | < 2 seconds |
| UX-04 | Immediate Access | Product access granted automatically upon payment confirmation |
| UX-05 | Unified Interface | Single web application for all learning activities |

### 2.2.3 Operational Goals

| ID | Objective | Target |
|---|---|---|
| OP-01 | Monthly AWS Cost | ≤ USD 10 |
| OP-02 | Uptime | 99.5% |
| OP-03 | Manual Intervention | Zero for payment and access granting |
| OP-04 | Recovery Time Objective | 4 hours |
| OP-05 | Recovery Point Objective | 15 minutes |

## 2.3 User Groups

| User Role | Description | Responsibilities |
|---|---|---|
| **Guest** | Non-registered visitor accessing public pages | Browse product catalog, view product details, register account, login |
| **Registered User** | Authenticated user with an active account | Purchase products, access dashboard, access owned learning materials and quiz content, manage profile, view payment history |

---

# 3. Proposed System Architecture

## 3.1 Architecture Overview

### 3.1.1 High-Level System Layout

The KeJepangDulu platform follows a **fully serverless content delivery architecture** on AWS. The system is decomposed into distinct logical tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT TIER                           │
│                    (User's Browser)                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     CDN / EDGE TIER                         │
│                    (CloudFront CDN)                         │
│    ┌──────────────────┬──────────────────────────┐          │
│    │  Static Assets   │   Content Delivery       │          │
│    │  (S3 Frontend)   │   (S3 Private → Signed)  │          │
│    └──────────────────┴──────────────────────────┘          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                      API TIER                               │
│               (API Gateway — REST)                          │
│    ┌───────────┬────────────┬──────────────────┐            │
│    │   Auth    │  Products  │    Payment       │            │
│    │  Routes   │   Routes   │    Routes        │            │
│    └───────────┴────────────┴──────────────────┘            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    COMPUTE TIER                              │
│                  (AWS Lambda)                                │
│    ┌───────┬────────┬─────────┬──────────┬──────────┐       │
│    │ Auth  │ User   │ Product │ Payment  │ Content  │       │
│    │ Fns   │ Fns    │ Fns     │ Fns      │ Fns      │       │
│    └───────┴────────┴─────────┴──────────┴──────────┘       │
└──────┬────────────────────┬─────────────────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────────────────────────────────┐
│  AUTH TIER   │   │            DATA TIER                     │
│  (Cognito)   │   │  ┌────────────┐  ┌───────────────────┐  │
│              │   │  │  DynamoDB   │  │  S3 Private       │  │
│              │   │  │  (Tables)   │  │  (Content Store)  │  │
│              │   │  └────────────┘  └───────────────────┘  │
└──────────────┘   └──────────────────────────────────────────┘
```

### 3.1.2 Logical Separation

The architecture enforces strict logical separation between concerns:

| Tier | Responsibility | AWS Service |
|---|---|---|
| Client | User interface rendering, client-side quiz interaction | Browser |
| Edge / CDN | Static asset caching, HTTPS termination, signed URL delivery | CloudFront |
| API | Request routing, authentication enforcement, rate limiting | API Gateway |
| Compute | Business logic execution, access verification, URL signing | Lambda |
| Authentication | User identity, token issuance, credential management | Cognito |
| Database | Transactional data storage, metadata indexing | DynamoDB |
| Storage | Content persistence, asset hosting | S3 |
| DNS | Domain resolution, SSL certificate management | Route 53, ACM |
| Monitoring | Logging, metrics, alerting, cost tracking | CloudWatch, Budgets |

## 3.2 Frontend Architecture

### 3.2.1 Framework

The frontend is built using **Next.js** configured for **static export**. This produces a fully static HTML/CSS/JavaScript bundle that requires no server-side rendering infrastructure. The static output is deployed to an S3 bucket and served globally through CloudFront CDN.

This approach is selected for:

- **Zero compute cost** for frontend hosting
- **Global low-latency delivery** via CDN edge caching
- **High availability** through S3's 99.99% durability
- **Simple deployment** — static file upload only

### 3.2.2 UI Approach

The frontend is responsible for:

| Module | Description |
|---|---|
| Authentication UI | Registration, login, logout, email verification flows |
| Dashboard UI | Purchased products display, recent materials, account summary |
| Product Catalog | Public product listing and product detail pages |
| Material Viewer | Secure rendering of PDF, image, and audio materials loaded via signed URLs |
| Quiz Viewer | Client-side rendering of quiz JSON content with local interaction handling |
| Profile Management | Display name editing, payment history viewing |
| Payment Interface | Midtrans checkout initiation and payment status handling |

### 3.2.3 State Management

Client-side state management handles:

- Authentication state (JWT tokens, session validity)
- Navigation state (current product, topic, session context)
- Quiz interaction state (selected answers, question navigation, answer reveal)

All quiz interaction occurs entirely on the client. No answer data is transmitted to the backend for scoring. Quiz content is a **view-only content type** rendered from structured JSON.

### 3.2.4 Validation Strategy

Client-side validation is applied to:

- Registration form inputs (email format, password strength)
- Profile update forms (display name constraints)
- Payment initiation requests (product selection verification)

All client-side validation is **complemented by server-side validation** at the API tier. Client-side validation exists solely for user experience improvement and does not constitute a security boundary.

### 3.2.5 Frontend Hosting Structure

```
S3 Bucket: kejepangdulu-frontend

/index.html
/assets/
/css/
/js/
```

CDN caching configuration:

| Asset Type | Cache TTL |
|---|---|
| Static assets (CSS, JS, images) | 365 days |
| HTML pages | Short TTL with cache invalidation on deploy |
| API responses | 60 seconds |

## 3.3 Backend Architecture

### 3.3.1 Services

The backend is implemented as a collection of **AWS Lambda functions** organised into logical function groups, exposed through a single **API Gateway REST API** with Cognito Authorizer integration.

### 3.3.2 Modules and Responsibilities

| Module | Lambda Functions | Responsibility |
|---|---|---|
| **Auth** | `register_user`, `login_user` | User registration, credential validation, token issuance |
| **User** | `get_dashboard`, `update_profile` | Dashboard data retrieval, profile management |
| **Product** | — | Product catalog and product detail data served as static JSON from public S3 via CloudFront; no Lambda function required for catalog browsing |
| **Payment** | `create_payment`, `payment_webhook` | Midtrans order creation, webhook signature verification, access granting |
| **Material** | `get_material_list` | Material metadata retrieval for owned products |
| **Content** | `generate_signed_url` | CloudFront Signed URL generation for private content access |
| **Admin** | `process_content_upload` | Excel-driven content ingestion: parsing, validation, JSON generation, S3 storage, and DynamoDB metadata registration |

### 3.3.3 Lambda Configuration Standards

| Parameter | Value |
|---|---|
| Runtime | Node.js 20.x |
| Memory | 256 MB |
| Timeout | 5 seconds |
| Logging | Enabled (CloudWatch Logs) |

### 3.3.4 Architectural Exclusions

The following components are explicitly **excluded by design**:

- Quiz scoring Lambda — quiz evaluation is client-side only
- Answer processing Lambda — no backend answer handling exists
- Real-time notification Lambda — not required for MVP
- Product catalog Lambda (`list_products`, `get_product_detail`) — product catalog and product detail data is served as static JSON from the `kejepangdulu-catalog-public` S3 bucket via CloudFront; no Lambda invocation is required for public catalog browsing

## 3.4 CMS / Content Architecture

### 3.4.1 Content Storage

All learning content is stored in a **private S3 bucket** (`kejepangdulu-content-private`) with public access disabled at the bucket level. Content is never served directly from S3; all access passes through CloudFront with Signed URL authentication.

The content pipeline introduces two additional S3 buckets to support the Excel-based ingestion workflow:

| Bucket | Purpose | Access |
|---|---|---|
| `kejepangdulu-content-upload` | Receives administrator-uploaded Excel template files | Private (admin write, Lambda read) |
| `kejepangdulu-media-upload` | Receives administrator-uploaded media files (images, audio, PDFs) | Private (admin write, Lambda read) |
| `kejepangdulu-content-private` | Stores Lambda-generated quiz JSON and processed media | Private (Signed URL only) |
| `kejepangdulu-catalog-public` | Stores the publicly accessible product catalog (`catalog.json`) containing all product listing and detail data | Public (via CloudFront) |

Content types supported:

| Type | Format | Maximum Size | Notes |
|---|---|---|---|
| Quiz Questions | JSON (UTF-8) | Controlled | Generated by Lambda from Excel input |
| PDF Materials | PDF | 10 MB | Compressed, optional password protection |
| Images | PNG, JPG | 2 MB | Max 1920px resolution, compressed |
| Audio | MP3 | 5 MB | ≤ 128 kbps bitrate, compressed |

### 3.4.2 Content Storage Structure

```
s3://kejepangdulu-content-private/

  products/
    {product_slug}/
      topics/
        {topic_slug}/
          sessions/
            {session_slug}/
              quiz.json
              images/
                image_01.png
                image_02.png
              audio/
                audio_01.mp3
              pdf/
                module_01.pdf
```

```
s3://kejepangdulu-catalog-public/

  catalog.json
```

`catalog.json` contains the full product catalog array, with each entry including complete product detail, topic, and session metadata. This file is generated automatically by the `process_content_upload` Lambda function during content ingestion and requires no manual maintenance.

### 3.4.3 Content Ingestion Workflow

Content follows a structured Lambda-mediated lifecycle triggered by administrator uploads:

```
UPLOAD (Excel + Media) → S3 TRIGGER → LAMBDA PARSE → VALIDATE → GENERATE JSON → STORE → PUBLISH CATALOG → REGISTER → DELIVER
```

| Phase | Responsibility | Actor |
|---|---|---|
| Upload | Administrator uploads `.xlsx` to `content-upload` bucket and media files to `media-upload` bucket | Administrator |
| S3 Trigger | S3 event notification invokes `process_content_upload` Lambda | S3 / Lambda |
| Parse | Lambda reads and parses all sheets from the Excel file | Lambda |
| Validate | Lambda validates relational integrity, media references, and field constraints | Lambda |
| Generate | Lambda converts validated rows into structured `quiz.json` files per session | Lambda |
| Store | Generated JSON and processed media are written to `content-private` bucket in the defined path structure | Lambda |
| Publish Catalog | Lambda generates and writes `catalog.json` (full product catalog including all product detail, topic, and session metadata) to the `catalog-public` bucket; CloudFront cache is invalidated for the catalog path | Lambda |
| Register | Lambda writes content metadata entries to DynamoDB `content_metadata` table | Lambda |
| Deliver | Content becomes accessible to entitled users via CloudFront Signed URLs | CloudFront |

**Lambda Function:** `process_content_upload`

| Parameter | Value |
|---|---|
| Trigger | S3 ObjectCreated event on `content-upload` bucket |
| Runtime | Node.js 20.x |
| Memory | 512 MB |
| Timeout | 60 seconds |
| Output | `quiz.json` files written to `content-private`; `catalog.json` written to `catalog-public`; metadata written to DynamoDB; CloudFront cache invalidation issued for the catalog path |

### 3.4.4 Content Editing Approach

Content updates follow the same pipeline as initial ingestion. The administrator prepares a revised Excel file, uploads it to the `content-upload` bucket, and the Lambda processing pipeline executes automatically. Updated quiz JSON is written to S3 with versioning enabled, allowing rollback to any prior version.

Logical version tracking follows the convention `session_01_v1.json`, `session_01_v2.json` for human-readable rollback identification.

S3 versioning provides:

- Rollback support for content errors
- Audit trail for content changes
- Protection against accidental deletion

### 3.4.5 Excel Content Template Structure

The Excel content template (`.xlsx`) is the authoritative source for all content ingestion. The template defines five structured worksheets with enforced column schemas.

**Sheet 1: 1_Products**

| Column | Type | Description |
|---|---|---|
| `product_id` | String | Unique product identifier (e.g., `PRODUCT_001`) |
| `product_name` | String | Product display name |
| `price` | Number | Product price in IDR |
| `access_type` | String | `lifetime` or `subscription` |
| `cover_image` | String | Filename of public product cover image |

**Sheet 2: 2_Topics**

| Column | Type | Description |
|---|---|---|
| `product_id` | String | Foreign key → `1_Products.product_id` |
| `topic_slug` | String | Unique topic identifier within product |
| `topic_name` | String | Topic display name |
| `sort_order` | Number | Display ordering index |

**Sheet 3: 3_Sessions**

| Column | Type | Description |
|---|---|---|
| `product_id` | String | Foreign key → `1_Products.product_id` |
| `topic_slug` | String | Foreign key → `2_Topics.topic_slug` |
| `session_slug` | String | Unique session identifier within topic |
| `session_name` | String | Session display name |
| `sort_order` | Number | Display ordering index |

**Sheet 4: 4_Questions**

| Column | Type | Description |
|---|---|---|
| `question_id` | String | Unique question identifier (e.g., `Q001`) |
| `product_id` | String | Foreign key → `1_Products.product_id` |
| `topic_slug` | String | Foreign key → `2_Topics.topic_slug` |
| `session_slug` | String | Foreign key → `3_Sessions.session_slug` |
| `question_text` | String | Question body text |
| `option_a` | String | Answer option A |
| `option_b` | String | Answer option B |
| `option_c` | String | Answer option C |
| `option_d` | String | Answer option D |
| `correct_answer` | String | Correct answer value matching one of the option columns |
| `image_file` | String (optional) | Filename of associated image; empty if none |
| `audio_file` | String (optional) | Filename of associated audio; empty if none |

**Sheet 5: 5_Media**

| Column | Type | Description |
|---|---|---|
| `filename` | String | Media filename including extension |
| `media_type` | String | `image`, `audio`, or `pdf` |
| `product_id` | String | Foreign key → `1_Products.product_id` |
| `description` | String (optional) | Human-readable description for inventory tracking |

**Relational Integrity Rules:**

- Every `topic_slug` in `2_Topics` must reference an existing `product_id` in `1_Products`
- Every `session_slug` in `3_Sessions` must reference an existing `topic_slug` in `2_Topics`
- Every question row in `4_Questions` must reference an existing `session_slug` in `3_Sessions`
- Every `image_file` and `audio_file` referenced in `4_Questions` must exist as an uploaded object in the `media-upload` bucket
- All `question_id` values within a product must be globally unique

Lambda validates all relational constraints before any JSON generation or DynamoDB write is performed. Validation failure causes the entire ingestion batch to be rejected with a structured error report written to CloudWatch Logs.

## 3.5 API Layer Architecture

### 3.5.1 REST Design

The API follows REST conventions exposed through AWS API Gateway (Regional endpoint type). All API endpoints require HTTPS. Authentication-protected routes use a Cognito Authorizer that validates JWT tokens before request processing.

### 3.5.2 Endpoint Structure

**Authentication APIs**

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Register new user account |
| POST | `/auth/login` | No | Authenticate user and issue JWT |
| POST | `/auth/logout` | Yes | Invalidate user session |

**Product Catalog**

Product catalog and product detail data is served from a single `catalog.json` static file hosted in the `kejepangdulu-catalog-public` S3 bucket via CloudFront. The frontend fetches this file for both the product listing page and product detail views. No API Gateway endpoint or Lambda invocation is required:

| Resource | URL Pattern | Auth Required | Description |
|---|---|---|---|
| Product catalog & detail | `https://cdn.{domain}/catalog/catalog.json` | No | Full product catalog including all product detail, topic, and session metadata as a static JSON file, generated on content ingestion |

This file is generated and published automatically by the `process_content_upload` Lambda function and is cached at CloudFront edge nodes with a 24-hour TTL. Cache invalidation is issued automatically by Lambda upon each content ingestion cycle.

**Material APIs**

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/products/{productId}/materials` | Yes | Retrieve material list with signed URLs |

**Quiz Content APIs**

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| GET | `/products/{productId}/quiz` | Yes | Retrieve signed URL to quiz JSON |

**Payment APIs**

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| POST | `/payment/create` | Yes | Create Midtrans payment order |
| POST | `/payment/webhook` | No* | Receive Midtrans payment notification |

*Webhook endpoint authenticates via Midtrans signature verification rather than JWT.

### 3.5.3 Versioning

API versioning is not implemented for MVP. Future API version management will be handled through API Gateway stage-based versioning (e.g., `/v1/`, `/v2/`) when breaking changes are introduced.

### 3.5.4 Validation

All API inputs are validated server-side:

- Request body schema validation
- Path parameter format validation
- Query parameter sanitisation
- JWT token integrity verification
- Midtrans webhook signature verification

## 3.6 Database Architecture

### 3.6.1 Schema Strategy

The platform uses **Amazon DynamoDB** in on-demand capacity mode. DynamoDB is selected for its serverless operation model, auto-scaling capability, and low cost at the expected data volumes.

Data modelling follows DynamoDB single-table design principles where appropriate, with dedicated tables for distinct entity domains to maintain clarity and operational isolation.

### 3.6.2 Core Entities

| Table | Partition Key | Sort Key | Description |
|---|---|---|---|
| `users` | `user_id` | — | User profiles and account information |
| `products` | `product_id` | — | Product catalog definitions |
| `payments` | `payment_id` | — | Payment transaction records |
| `user_product_access` | `user_id` | `product_id` | Access entitlement mapping |
| `content_metadata` | `product_id` | `session_slug` | Content metadata and versioning |

### 3.6.3 Entity Attributes

**Users Table**

| Attribute | Type | Description |
|---|---|---|
| `user_id` | String (PK) | Unique user identifier |
| `email` | String | User email address |
| `display_name` | String | User display name |
| `created_at` | String (ISO 8601) | Account creation timestamp |

**Products Table**

| Attribute | Type | Description |
|---|---|---|
| `product_id` | String (PK) | Unique product identifier |
| `product_name` | String | Product display name |
| `price` | Number | Product price in IDR |
| `access_type` | String | `lifetime` or `subscription` |

**Payments Table**

| Attribute | Type | Description |
|---|---|---|
| `payment_id` | String (PK) | Unique payment identifier |
| `user_id` | String | Reference to purchasing user |
| `product_id` | String | Reference to purchased product |
| `amount` | Number | Payment amount in IDR |
| `status` | String | Payment status (pending, success, failed) |
| `created_at` | String (ISO 8601) | Payment creation timestamp |

**User Product Access Table**

| Attribute | Type | Description |
|---|---|---|
| `user_id` | String (PK) | User identifier |
| `product_id` | String (SK) | Product identifier |

**Content Metadata Table**

| Attribute | Type | Description |
|---|---|---|
| `product_id` | String (PK) | Product identifier |
| `session_slug` | String (SK) | Session identifier |
| `topic_slug` | String | Topic identifier |
| `question_count` | Number | Number of questions in session |
| `asset_count` | Number | Number of associated assets |
| `version` | Number | Content version number |

### 3.6.4 Relationships

- A **User** may have multiple **Payments**
- A **User** may have access to multiple **Products** (via `user_product_access`)
- A **Product** contains multiple **Content Metadata** entries
- A **Payment** links one **User** to one **Product**
- Access entitlement in `user_product_access` is the authoritative source for content access decisions

---

# 4. Data Flow Architecture

## 4.1 Registration Flow

```
Step 1 — User opens registration page
Step 2 — User submits email, password (or initiates Google OAuth)
Step 3 — Frontend sends POST /auth/register to API Gateway
Step 4 — Lambda invokes Cognito to create user account
Step 5 — Cognito sends verification email to user
Step 6 — User clicks verification link
Step 7 — Account status updated to verified in Cognito
Step 8 — User record created in DynamoDB users table
Step 9 — Registration complete — user may now login
```

## 4.2 Authentication Flow

```
Step 1 — User submits login credentials (email/password or Google OAuth)
Step 2 — Frontend sends POST /auth/login to API Gateway
Step 3 — Lambda authenticates against Cognito
Step 4 — Cognito returns JWT access token and refresh token
Step 5 — Frontend stores tokens securely
Step 6 — All subsequent API requests include JWT in Authorization header
Step 7 — API Gateway Cognito Authorizer validates token before routing
```

## 4.3 Product Catalog Browsing Flow

```
Step 1 — User (guest or authenticated) opens product catalog or product detail page
Step 2 — Frontend issues a single HTTPS GET request directly to CloudFront catalog distribution
           GET https://cdn.{domain}/catalog/catalog.json
Step 3 — CloudFront serves catalog.json from edge cache (if cached)
           — or —
           CloudFront fetches catalog.json from the S3 catalog-public bucket origin (on cache miss)
Step 4 — Frontend parses the JSON response; product listing renders the catalog array,
           product detail view filters to the matching product entry within the same response
Step 5 — No API Gateway endpoint, no Lambda invocation, and no authentication are involved
```

## 4.4 Purchase Flow

```
Step 1  — Authenticated user selects product from catalog
Step 2  — Frontend sends POST /payment/create with product ID
Step 3  — Lambda creates payment record in DynamoDB (status: pending)
Step 4  — Lambda calls Midtrans API to create transaction order
Step 5  — Midtrans returns payment token/redirect URL
Step 6  — Frontend redirects user to Midtrans checkout page
Step 7  — User completes payment on Midtrans
Step 8  — Midtrans sends POST /payment/webhook with transaction result
Step 9  — Lambda verifies Midtrans signature against server key
Step 10 — Lambda updates payment record status in DynamoDB
Step 11 — Lambda creates entry in user_product_access table
Step 12 — User now has access to purchased product content
```

## 4.5 Learning Material Access Flow

```
Step 1 — Authenticated user navigates to purchased product
Step 2 — Frontend sends GET /products/{productId}/materials with JWT
Step 3 — API Gateway validates JWT via Cognito Authorizer
Step 4 — Lambda verifies user_product_access record exists
Step 5 — Lambda retrieves content metadata from DynamoDB
Step 6 — Lambda generates CloudFront Signed URLs for each material
Step 7 — Signed URLs returned to frontend with material metadata
Step 8 — Frontend renders material list with secure access links
Step 9 — User selects material — browser requests content via Signed URL
Step 10 — CloudFront validates signature and serves content from S3
```

## 4.6 Quiz Viewing Flow

```
Step 1 — Authenticated user opens quiz topic within purchased product
Step 2 — Frontend sends GET /products/{productId}/quiz with JWT
Step 3 — API Gateway validates JWT via Cognito Authorizer
Step 4 — Lambda verifies user_product_access record exists
Step 5 — Lambda generates CloudFront Signed URL for quiz.json
Step 6 — Signed URL returned to frontend
Step 7 — Frontend fetches quiz.json via Signed URL
Step 8 — CloudFront validates signature and serves JSON from S3
Step 9 — Frontend parses and renders quiz questions
Step 10 — User interacts with quiz entirely on client side
Step 11 — User selects answers, navigates questions, optionally views answers
Step 12 — No data transmitted to backend — all interaction is local
```

## 4.7 Reporting Flow

```
Step 1 — System events (login, payment, content access, errors)
         are logged to CloudWatch Logs
Step 2 — CloudWatch Metrics capture Lambda errors, API latency,
         payment failures
Step 3 — AWS Budgets monitors monthly spending against USD 10 target
Step 4 — Budget alerts triggered at 80% threshold
Step 5 — CloudWatch Alarms configured for critical error thresholds
Step 6 — Operational team reviews dashboards and log groups
```

---

# 5. Role-Based Access Control Model

## 5.1 User Roles

The platform defines two user roles with no administrative role exposed through the user-facing application. Administrative operations are performed through dedicated admin API endpoints with separate access control.

| Role | Description | Authentication Required |
|---|---|---|
| **Guest** | Unauthenticated visitor | No |
| **Registered User** | Authenticated user with verified account | Yes |

## 5.2 Permission Matrix

| Permission | Guest | Registered User |
|---|---|---|
| View product catalog | ✅ | ✅ |
| View product detail | ✅ | ✅ |
| Register account | ✅ | — |
| Login | ✅ | — |
| Access dashboard | ❌ | ✅ |
| Purchase product | ❌ | ✅ |
| Access learning materials | ❌ | ✅ (requires product ownership) |
| Access quiz content | ❌ | ✅ (requires product ownership) |
| View profile | ❌ | ✅ |
| Update profile | ❌ | ✅ |
| View payment history | ❌ | ✅ |

## 5.3 Access Boundaries

Content access is governed by a **two-layer access control model**:

1. **Authentication Layer (Cognito + JWT):** Validates that the requesting user is authenticated and holds a valid, non-expired token. Enforced at API Gateway level.

2. **Entitlement Layer (DynamoDB Lookup):** Validates that the authenticated user owns the requested product by querying the `user_product_access` table. Enforced at Lambda function level.

Both layers must pass before a Signed URL is generated. Failure at either layer results in an access denial response.

---

# 6. Environment & Deployment Architecture

## 6.1 Environment Strategy

The platform operates across two environments:

| Environment | Purpose | Infrastructure |
|---|---|---|
| **Development (dev)** | Development, testing, integration validation | Isolated AWS resources with `dev` environment suffix |
| **Production (prod)** | Live user-facing environment | Isolated AWS resources with `prod` environment suffix |

Resource naming follows the convention: `kejepangdulu-{environment}-{resource-name}`

## 6.2 Environment Separation

Each environment maintains fully isolated:

- S3 buckets (frontend, content, backup)
- DynamoDB tables
- Lambda functions
- API Gateway deployments
- Cognito User Pools
- CloudFront distributions
- CloudWatch Log Groups
- IAM roles and policies

No cross-environment resource sharing exists. Environment isolation is enforced through distinct Terraform workspaces and variable files.

## 6.3 Infrastructure as Code

All infrastructure is defined and managed through **Terraform**, organised in a modular structure.

## 6.4 Deployment Pipeline (CI/CD)

The CI/CD pipeline is implemented using **GitHub Actions** and follows a structured progression:

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  BUILD   │────▶│   TEST   │────▶│  DEPLOY  │
└──────────┘     └──────────┘     └──────────┘
```

### Build Stage

- Install dependencies
- Compile frontend static export
- Package Lambda function artifacts
- Lint and format validation

### Test Stage

- Unit test execution
- Integration test execution
- Security scanning (secrets detection, SAST, dependency checking)

### Deploy Stage

- Terraform plan and apply for infrastructure changes
- S3 sync for frontend deployment
- Lambda function deployment
- CloudFront cache invalidation
- Smoke test validation

### Pipeline Governance

- All deployments to production require successful passage through the full pipeline
- Infrastructure changes are reviewed through Terraform plan output before apply
- Deployment artifacts are versioned and traceable

---

# 7. Security Architecture

## 7.1 OWASP Controls

The platform implements controls aligned with the OWASP Top 10 risk categories:

### 7.1.1 Injection Protection (A03:2021)

- **NoSQL Injection:** DynamoDB queries use parameterised operations through the AWS SDK. No raw query string construction is permitted.
- **Input Sanitisation:** All API inputs are validated and sanitised at the Lambda layer before database operations.
- **Content Security:** Quiz JSON is static content served from S3 — no user input is interpolated into content.

### 7.1.2 Cross-Site Scripting (XSS) Protection (A07:2021)

- Frontend framework (Next.js/React) provides automatic output encoding
- Content-Security-Policy headers configured on CloudFront responses
- No inline HTML permitted in quiz JSON content
- User-generated content (display name) is sanitised on storage and escaped on rendering

### 7.1.3 Cross-Site Request Forgery (CSRF) Protection (A01:2021)

- JWT-based authentication transmitted via Authorization header (not cookies) eliminates traditional CSRF vectors
- API Gateway enforces restricted CORS policy limiting allowed origins
- State-changing operations require authenticated requests with valid JWT

### 7.1.4 Authentication Attack Protection (A07:2021)

- AWS Cognito enforces password complexity requirements
- Account lockout after repeated failed authentication attempts (Cognito-managed)
- JWT tokens have defined expiration (access: 1 hour, refresh: 30 days)
- Token refresh is handled through Cognito's secure refresh flow

### 7.1.5 API Abuse Protection (A04:2021)

- API Gateway rate limiting enabled to prevent abuse and denial-of-service
- Request throttling configured per-endpoint
- Cognito Authorizer rejects unauthenticated requests before Lambda invocation
- Payment webhook endpoint validates Midtrans signature to prevent spoofed notifications

## 7.2 Authentication Model

### 7.2.1 JWT-Based Authentication

| Parameter | Configuration |
|---|---|
| Token Type | JWT (JSON Web Token) |
| Issuer | AWS Cognito |
| Access Token Expiry | 1 hour |
| Refresh Token Expiry | 30 days |
| Token Storage | Client-side (secure, HttpOnly where applicable) |
| Token Validation | API Gateway Cognito Authorizer |

### 7.2.2 Session Management

- Access tokens are short-lived (1 hour) to limit exposure window
- Refresh tokens enable session continuity without re-authentication
- Logout invalidates the session via Cognito
- Token revocation supported through Cognito global sign-out

### 7.2.3 Supported Authentication Methods

| Method | Description |
|---|---|
| Email + Password | Standard credential-based authentication with email verification |
| Google OAuth | Federated identity through Google as social identity provider |

## 7.3 Data Protection

### 7.3.1 Encryption in Transit

- All client-server communication requires HTTPS (TLS 1.2+)
- CloudFront enforces HTTPS-only connections
- API Gateway rejects non-HTTPS requests
- SSL certificates managed through AWS Certificate Manager (ACM)

### 7.3.2 Encryption at Rest

| Service | Encryption | Method |
|---|---|---|
| DynamoDB | Enabled | AWS-managed encryption |
| S3 (all buckets) | Enabled | SSE-S3 or SSE-KMS |
| CloudWatch Logs | Enabled | AWS-managed encryption |

### 7.3.3 Secrets Management

- API keys, Midtrans server keys, and signing credentials are stored in AWS-native secrets management (SSM Parameter Store or Secrets Manager)
- No secrets are hardcoded in source code or configuration files
- Lambda functions retrieve secrets at runtime through IAM-authorized API calls
- Environment-specific secrets are isolated per deployment environment

### 7.3.4 Content Security

| Measure | Implementation |
|---|---|
| Private Storage | All content buckets have public access disabled |
| Signed URL Delivery | CloudFront Signed URLs with 5-minute expiration |
| Access Verification | Product ownership verified before URL generation |
| No Direct Access | S3 bucket policy blocks all direct access |
| No Public JSON | Quiz content inaccessible without valid signed URL |
| URL Expiration | Signed URLs expire after 5 minutes, requiring re-generation |

---

# 8. Hosting Infrastructure

## 8.1 Cloud Provider

Amazon Web Services (AWS) is the sole cloud infrastructure provider. The architecture uses exclusively serverless and managed services to eliminate infrastructure management overhead and align cost with actual usage.

## 8.2 Core Services

| Category | AWS Service | Purpose |
|---|---|---|
| **Frontend Hosting** | S3 | Static site hosting for Next.js export |
| **CDN** | CloudFront | Global content delivery, HTTPS termination, signed URLs |
| **API Management** | API Gateway (REST) | Request routing, authentication, rate limiting |
| **Compute** | Lambda | Business logic execution |
| **Authentication** | Cognito | User identity management, JWT issuance |
| **Database** | DynamoDB | Transactional data, metadata storage |
| **Object Storage** | S3 | Private content storage (quiz, PDF, images, audio) |
| **DNS** | Route 53 | Domain name resolution |
| **SSL/TLS** | ACM | Certificate provisioning and management |
| **Monitoring** | CloudWatch | Logs, metrics, alarms |
| **Cost Management** | AWS Budgets | Spending alerts and tracking |
| **Access Control** | IAM | Service-level and function-level permissions |
| **Infrastructure** | Terraform | Infrastructure as Code provisioning |
| **CI/CD** | GitHub Actions | Build, test, and deployment automation |

## 8.3 Compute Architecture

All compute workloads run on **AWS Lambda** — a fully managed, event-driven compute service. There are no EC2 instances, ECS containers, or always-on compute resources.

**Lambda Architecture Characteristics:**

| Characteristic | Value |
|---|---|
| Invocation Model | Synchronous (API Gateway trigger) |
| Runtime | Node.js 20.x |
| Memory | 256 MB per function |
| Timeout | 5 seconds per function |
| Concurrency | AWS-managed auto-scaling |
| Cold Start Mitigation | Lightweight function packaging, minimal dependencies |
| Pricing Model | Pay-per-invocation (no idle cost) |

## 8.4 Storage Architecture

| Bucket | Purpose | Access | Versioning |
|---|---|---|---|
| `kejepangdulu-frontend` | Static web application hosting | Public (via CloudFront OAI) | Disabled |
| `kejepangdulu-catalog-public` | Publicly accessible product catalog (`catalog.json`) containing all product listing and detail data | Public (via CloudFront) | Disabled |
| `kejepangdulu-content-upload` | Receives administrator-uploaded Excel content template files | Private (admin write, Lambda read) | Disabled |
| `kejepangdulu-media-upload` | Receives administrator-uploaded media files (images, audio, PDFs) | Private (admin write, Lambda read) | Disabled |
| `kejepangdulu-content-private` | Lambda-generated quiz JSON and processed learning content | Private (Signed URL only) | Enabled |
| `kejepangdulu-backup` | Disaster recovery, content restoration | Private | Enabled |

---

# 9. Scalability and Performance Strategy

## 9.1 Scaling Method

The platform architecture is inherently auto-scaling by design. Every component in the stack scales independently and automatically:

| Component | Scaling Model | Details |
|---|---|---|
| CloudFront | Automatic | Global edge network absorbs traffic spikes |
| API Gateway | Automatic | Scales to handle thousands of concurrent requests |
| Lambda | Automatic | Concurrent execution scales per-function |
| DynamoDB | On-Demand | Read/write capacity scales with workload |
| S3 | Automatic | Unlimited storage and request throughput |
| Cognito | Automatic | Scales with authentication volume |

No manual scaling configuration, capacity reservations, or auto-scaling policies are required.

## 9.2 Load Handling

**Initial Capacity Target:** 200 concurrent users

**Load Distribution Strategy:**

1. Static frontend assets served entirely from CloudFront edge cache — no origin load for cached content
2. API requests distributed through API Gateway to Lambda functions
3. DynamoDB on-demand mode absorbs unpredictable access patterns
4. Content delivery through CloudFront reduces S3 origin requests

**Anticipated Load Profile:**

| Request Type | Frequency | Caching |
|---|---|---|
| Static page load | High | Fully cached at CDN edge (365-day TTL) |
| Product catalog (S3/CloudFront) | Medium | Fully cached at CDN edge (24-hour TTL, invalidated on content ingestion) |
| Content access (Signed URL generation) | Medium | Not cached (per-request generation) |
| Payment operations | Low | Not cached |
| Authentication | Low | Not cached |

## 9.3 Caching Strategy

| Layer | Target | TTL | Purpose |
|---|---|---|---|
| CloudFront — Static | Frontend assets (HTML, CSS, JS, images) | 365 days | Eliminate origin requests for static content |
| CloudFront — Catalog | Product catalog and product detail JSON (`catalog-public` bucket) | 24 hours (invalidated on content ingestion) | Full CDN caching for public catalog data; eliminates any Lambda or API Gateway invocation for product browsing |
| CloudFront — Content | Signed URL content delivery | Per signed URL expiry (5 min) | Content caching with access-controlled delivery |

## 9.4 Database Scaling

DynamoDB on-demand mode automatically scales read and write capacity in response to workload changes. This eliminates the need for capacity planning, provisioned throughput management, or auto-scaling policy configuration.

**Cost Optimisation:** On-demand mode is cost-effective at the expected data volumes (< 10,000 items across all tables). If sustained high-throughput patterns emerge, migration to provisioned capacity with auto-scaling policies may be evaluated.

---

# 10. Workflow Implementation

## 10.1 System State Transitions

### 10.1.1 User Account States

```
UNVERIFIED → VERIFIED → ACTIVE
```

| Transition | Trigger | System Action |
|---|---|---|
| Unverified → Verified | User clicks email verification link | Cognito updates account status |
| Verified → Active | User completes first login | Session established, dashboard accessible |

### 10.1.2 Payment States

```
PENDING → SUCCESS
PENDING → FAILED
```

| Transition | Trigger | System Action |
|---|---|---|
| Pending → Success | Midtrans webhook (settlement) | Update payment record, create access entitlement |
| Pending → Failed | Midtrans webhook (deny/expire/cancel) | Update payment record, no access granted |

### 10.1.3 Content Access States

```
NO ACCESS → ACCESS GRANTED
```

| Transition | Trigger | System Action |
|---|---|---|
| No Access → Access Granted | Payment status transitions to Success | `user_product_access` record created |

## 10.2 Automation Rules

| Rule | Trigger | Action |
|---|---|---|
| Auto-grant access | Payment webhook (success) | Create `user_product_access` entry |
| Signed URL generation | Content access request | Generate 5-minute CloudFront Signed URL |
| Email verification | User registration | Cognito sends verification email |
| Budget alert | AWS spend reaches 80% of limit | Notification to operational contact |

## 10.3 Notification Triggers

| Event | Notification Type | Recipient |
|---|---|---|
| User registration | Email verification | User |
| Payment success | Payment confirmation (future) | User |
| Budget threshold breach | Budget alert | Operations |
| Critical error spike | CloudWatch alarm | Operations |

---

# 11. Content Management Strategy

## 11.1 Content Lifecycle

The content lifecycle follows an Excel-driven ingestion pipeline from source material to secure delivery:

```
PREPARE (Excel) → UPLOAD → PARSE → VALIDATE → TRANSFORM → STORE → REGISTER → DELIVER
```

| Phase | Description | Output |
|---|---|---|
| Prepare | Administrator populates the Excel content template with product, topic, session, and question data | Completed `.xlsx` file |
| Upload | Administrator uploads Excel file to `content-upload` bucket and media files to `media-upload` bucket | S3 objects in upload buckets |
| Parse | Lambda reads all template sheets and extracts structured row data | In-memory data model |
| Validate | Lambda enforces relational integrity, checks for duplicate IDs, and verifies media file existence | Validation report |
| Transform | Lambda converts validated row data into structured `quiz.json` files per session | Quiz JSON files |
| Store | Lambda writes JSON and media into `content-private` bucket at the defined path structure | S3 objects in `content-private` |
| Register | Lambda writes content metadata entries to DynamoDB `content_metadata` table | `content_metadata` table entries |
| Deliver | Entitled users receive CloudFront Signed URLs to access content | Secure content delivery |

## 11.2 Publishing Workflow

Content publishing is an administrative operation executed without technical intervention:

1. Administrator completes the Excel content template per the defined schema (see Section 3.4.5)
2. Administrator uploads the `.xlsx` file to the `content-upload` S3 bucket
3. Administrator uploads associated media files (images, audio, PDFs) to the `media-upload` S3 bucket
4. S3 ObjectCreated event triggers the `process_content_upload` Lambda function automatically
5. Lambda parses all sheets and validates relational integrity and media references
6. On validation success, Lambda generates `quiz.json` files and stores all content in `content-private`
7. Lambda registers content metadata in DynamoDB
8. Content becomes accessible to entitled users upon successful processing completion
9. On validation failure, Lambda writes a structured error report to CloudWatch Logs; no partial content is stored and no DynamoDB writes are performed

## 11.3 Content Validation Logic

Lambda enforces the following validation rules during ingestion prior to any write operation:

**Duplicate ID Detection**

- All `question_id` values within `4_Questions` are checked for uniqueness within the ingestion batch
- Duplicate `session_slug` values within a product are flagged and the batch is rejected
- Duplicate `topic_slug` values within a product are flagged and the batch is rejected

**Missing Reference Detection**

- Every `topic_slug` in `2_Topics` is validated against `1_Products`
- Every `session_slug` in `3_Sessions` is validated against `2_Topics`
- Every question row in `4_Questions` is validated against `3_Sessions`
- Any row referencing a non-existent parent entity causes batch rejection

**Invalid Media Reference Detection**

- Every `image_file` and `audio_file` value referenced in `4_Questions` is checked against the list of objects present in the `media-upload` bucket
- Every media entry in `5_Media` is verified for physical file existence in the `media-upload` bucket
- References to absent media files cause batch rejection

**Validation Output**

Failed validation produces a structured report written to CloudWatch Logs and stored as a companion report object in the `content-upload` bucket:

```json
{
  "validation_report": {
    "timestamp": "2026-04-14T10:00:00Z",
    "source_file": "content_batch_001.xlsx",
    "status": "FAILED",
    "missing_files": [],
    "duplicate_ids": [],
    "invalid_references": [],
    "format_errors": []
  }
}
```

## 11.4 Content Versioning

S3 versioning is enabled on the `content-private` bucket. Version tracking follows:

- S3's native object versioning provides automatic version history for all Lambda-generated JSON files
- Logical versioning in filenames (e.g., `session_01_v2.json`) provides human-readable version tracking
- Content metadata table stores the current version number
- Rollback is performed by restoring a previous S3 object version and re-registering the corresponding DynamoDB metadata entry

## 11.5 Quiz JSON Schema

Lambda generates quiz JSON files conforming to the following standardised structure:

```json
{
  "product_id": "PRODUCT_001",
  "topic_slug": "kanji_n4",
  "session_slug": "session_01",
  "questions": [
    {
      "question_id": "Q001",
      "question_text": "Apa arti dari kanji 日?",
      "image_url": "images/q001.png",
      "audio_url": null,
      "options": ["hari", "bulan", "api", "air"],
      "correct_answer": "hari"
    }
  ]
}
```

**Schema Rules:**

- UTF-8 encoding required
- Structure generated exclusively by Lambda from validated Excel input
- No inline HTML permitted
- All assets referenced by relative path
- Maximum file size controlled per media normalisation rules

## 11.6 Excel Template Definition

The Excel content template is the sole authoring interface for non-technical administrators. Full column schemas for all five sheets (`1_Products`, `2_Topics`, `3_Sessions`, `4_Questions`, `5_Media`) are defined in Section 3.4.5. Template distribution and versioning is managed by the Technical Architect.

Template governance rules:

- Template schema changes require a new template version and a corresponding Lambda function update
- Administrators must not modify column headers or sheet names
- The template is distributed as a protected `.xlsx` file with header rows locked against modification
- Template version must be included in the filename (e.g., `content_template_v1.xlsx`) to ensure processing compatibility

---

# 12. Integration Architecture

## 12.1 Payment Gateway — Midtrans

| Parameter | Value |
|---|---|
| Provider | Midtrans |
| Integration Mode | Server-to-server (Snap API) |
| Environments | Sandbox (dev), Production (prod) |
| Authentication | Server key-based |
| Notification | Webhook (POST /payment/webhook) |
| Security | Server-side signature verification |

**Integration Flow:**

1. Lambda creates transaction via Midtrans Snap API
2. Frontend redirects to Midtrans checkout page
3. Midtrans processes payment
4. Midtrans sends webhook notification to platform
5. Lambda verifies signature using server key
6. System processes payment outcome (grant access or record failure)

**Security Controls:**

- Server key stored in AWS secrets management, never exposed to client
- Webhook signature verified before any database mutation
- Invalid signatures result in immediate rejection (HTTP 403)

## 12.2 Authentication Provider — AWS Cognito

| Parameter | Value |
|---|---|
| Provider | AWS Cognito |
| User Pool | Per-environment (dev, prod) |
| Identity Providers | Email/password, Google OAuth |
| Token Format | JWT |
| Email Verification | Required |

## 12.3 Monitoring — AWS CloudWatch

| Integration | Purpose |
|---|---|
| Lambda → CloudWatch Logs | Function execution logging |
| API Gateway → CloudWatch Logs | Request/response logging |
| CloudWatch Metrics | Lambda errors, API latency, invocation counts |
| CloudWatch Alarms | Threshold-based alerting for critical metrics |
| AWS Budgets | Cost monitoring and alerting |

## 12.4 Email — AWS Cognito (SES-backed)

Cognito handles transactional email delivery for:

- Email verification during registration
- Password reset flows (future)

For production volumes, Cognito will be configured to use Amazon SES as the email delivery provider to ensure reliable delivery and avoid Cognito's default email sending limits.

---

# 13. Data Management and Reporting

## 13.1 Reporting Model

The platform uses a log-based reporting model. All significant system events are captured in CloudWatch Logs with structured log entries:

| Event Category | Events Logged |
|---|---|
| Authentication | User login, registration, logout, failed attempts |
| Payment | Payment creation, webhook receipt, verification outcome, access granting |
| Content Access | Signed URL generation, content requests |
| Security | Unauthorised access attempts, invalid signatures, rate limit breaches |
| Errors | Lambda errors, API Gateway errors, integration failures |

## 13.2 Data Retention

| Data Type | Retention Period |
|---|---|
| User data | Unlimited |
| Quiz results | Unlimited (if implemented) |
| Payment records | 7 years |
| CloudWatch Logs | Configurable (30 days default, adjustable) |

## 13.3 Export Mechanisms

- CloudWatch Logs can be exported to S3 for long-term archival
- DynamoDB data can be exported via DynamoDB Export to S3 for bulk analysis
- Payment records exportable through administrative queries

## 13.4 Operational Analytics

| Metric | Source | Purpose |
|---|---|---|
| Active users | CloudWatch Logs (login events) | User engagement tracking |
| Revenue | DynamoDB (payments table) | Business performance monitoring |
| Content popularity | CloudWatch Logs (content access) | Content strategy insights |
| Error rates | CloudWatch Metrics | System health monitoring |
| AWS spending | AWS Budgets | Cost control |

---

# 14. UI/UX Strategy

## 14.1 Accessibility

The platform adheres to web accessibility fundamentals:

- Semantic HTML structure for screen reader compatibility
- Keyboard navigation support for all interactive elements
- Sufficient colour contrast ratios (WCAG 2.1 AA minimum)
- Alternative text for quiz images
- Clear focus indicators for interactive elements

## 14.2 Responsive Design

The platform is designed as a **mobile-first responsive web application**, reflecting the target user demographic's preference for mobile devices:

| Breakpoint | Target Device | Layout |
|---|---|---|
| < 768px | Mobile phones | Single-column, stacked navigation |
| 768px–1024px | Tablets | Adaptive two-column layout |
| > 1024px | Desktop | Full multi-column layout |

## 14.3 Usability Goals

| Goal | Implementation |
|---|---|
| Immediate access | Product access available within seconds of payment confirmation |
| Minimal navigation depth | Product → Topic → Session in maximum 3 clicks |
| Clear product information | Price, description, and included content visible on product page |
| Quiz usability | Clear question display, simple answer selection, easy navigation between questions |
| Audio/media playback | Native browser audio player for MP3 content |
| PDF viewing | In-browser PDF rendering or controlled viewer |
| Loading feedback | Visual loading indicators for content retrieval via signed URLs |
| Error messaging | Clear, actionable error messages in Bahasa Indonesia |

---

# 15. Migration Strategy

## 15.1 Data Migration Plan

Migration follows a structured pipeline that converts existing Google Form content into the Excel template format and processes it through the automated Lambda ingestion pipeline:

| Step | Activity | Output |
|---|---|---|
| 1 | Create comprehensive content inventory | `content_inventory_master.xlsx` |
| 2 | Export all Google Form questions | Raw question exports |
| 3 | Map questions to Excel template schema (`4_Questions` sheet) | Populated `4_Questions` sheet |
| 4 | Populate product, topic, and session metadata into Excel sheets (`1_Products`, `2_Topics`, `3_Sessions`) | Completed Excel template |
| 5 | Register all media file references in the `5_Media` sheet | Completed `5_Media` sheet |
| 6 | Normalise all media assets (compress, reformat, rename per naming conventions) | Normalised asset files |
| 7 | Upload completed Excel file to `content-upload` S3 bucket | Excel object in `content-upload` |
| 8 | Upload all normalised media files to `media-upload` S3 bucket | Media objects in `media-upload` |
| 9 | Lambda ingestion pipeline executes automatically | `quiz.json` files in `content-private`, DynamoDB metadata entries |
| 10 | Review Lambda-generated validation report | `validation_report.json` |
| 11 | Confirm content integrity and enable secure access delivery | Signed URL generation active |

### Bulk Import Support

The Excel-based ingestion pipeline natively supports bulk migration. A single Excel file may contain all products, topics, sessions, and questions for the entire content catalogue. Lambda processes the complete batch in a single execution, generating all `quiz.json` files and registering all metadata entries atomically. Partial batch processing does not occur — a validation failure causes full batch rejection, requiring the administrator to correct the Excel file and re-upload.

| Parameter | Value |
|---|---|
| Maximum sessions per batch | 50 |
| Retry on failure | Enabled |
| Maximum retries | 3 |
| Retry delay | 10 seconds |

## 15.2 Rollback Strategy

| Mechanism | Implementation |
|---|---|
| Pre-migration backup | Full backup of Google Drive, local archive, offline copy |
| S3 versioning | All content objects versioned — previous versions restorable |
| Backup bucket | `kejepangdulu-backup` provides disaster recovery copy |
| Metadata rollback | DynamoDB entries can be reverted to previous content versions |

## 15.3 Validation Steps

Lambda performs automated validation during ingestion. The following checks are executed before any content is stored or metadata is registered:

| Validation | Description |
|---|---|
| Relational integrity | Full parent-child relationship validation across all Excel sheets |
| Asset references | Every `image_file` and `audio_file` reference in `4_Questions` verified against `media-upload` bucket |
| File integrity | Checksum validation for uploaded media files |
| Naming compliance | All files verified to follow naming conventions before storage |
| Duplicate ID detection | All `question_id` values checked for uniqueness within the batch |
| Format validation | All media files confirmed to meet format requirements (PNG/JPG, MP3, PDF) |
| JSON structure | Generated `quiz.json` validated against defined schema post-generation |
| Functional testing | Verify quiz JSON loads, images render, audio plays, PDFs open |
| Performance testing | Confirm content load time < 2 seconds |

Validation produces a structured report:

```json
{
  "validation_report": {
    "timestamp": "2026-04-14T10:00:00Z",
    "source_file": "content_batch_001.xlsx",
    "status": "FAILED",
    "missing_files": [],
    "duplicate_ids": [],
    "invalid_references": [],
    "format_errors": []
  }
}
```

---

# 16. Testing Strategy

## 16.1 Unit Testing

| Scope | Target | Tool |
|---|---|---|
| Lambda functions | Individual function logic, input validation, error handling | Jest / Vitest |
| Frontend components | Component rendering, user interaction handling | React Testing Library |
| Utility functions | Data transformation, URL signing, signature verification | Jest / Vitest |

**Coverage Target:** Critical business logic paths — payment processing, access verification, signed URL generation.

## 16.2 Integration Testing

| Scope | Target | Method |
|---|---|---|
| API Gateway → Lambda | Request routing, authorizer integration, response formatting | API-level test suites |
| Lambda → DynamoDB | Data read/write operations, query correctness | Integration test with local DynamoDB |
| Lambda → S3 | Signed URL generation, content retrieval | Integration test with S3 mock |
| Lambda → Cognito | Authentication flow, token validation | Integration test with Cognito mock |
| Payment webhook | End-to-end payment → access granting | Mock Midtrans webhook payloads |

## 16.3 Security Testing

| Test Type | Scope | Method |
|---|---|---|
| Secrets detection | Source code, configuration files | Automated SAST scanning |
| Dependency analysis | Third-party package vulnerabilities | Dependency vulnerability scanning |
| SAST | Application source code | Static application security testing |
| API security | Authentication bypass, injection, abuse | Manual and automated API security testing |

## 16.4 Performance Testing

| Test | Target | Acceptance Criteria |
|---|---|---|
| API response time | All API endpoints | < 500 ms p95 |
| Page load time | Frontend pages | < 3 seconds |
| Content load time | Quiz JSON, PDF, images, audio | < 2 seconds |
| Concurrent users | System-wide | 200 concurrent users without degradation |

## 16.5 User Acceptance Testing (UAT)

| Test Area | Validation |
|---|---|
| Registration | User can register via email/password and Google OAuth |
| Login | User can authenticate and receive valid session |
| Product browsing | Product catalog and details display correctly |
| Purchase | Payment flow completes, access granted automatically |
| Material access | Learning materials load securely via signed URLs |
| Quiz viewing | Quiz JSON renders correctly, client-side interaction functional |
| Profile management | Display name editable, payment history visible |
| Content security | Unauthenticated and unauthorised access properly denied |

---

# 17. Phased Delivery Plan

## Phase 1 — Foundation & Core Infrastructure

**Objective:** Establish infrastructure foundation, authentication, and basic frontend.

| Deliverable | Description |
|---|---|
| AWS infrastructure bootstrap | Terraform state backend, IAM roles, logging, budget alerts |
| Core infrastructure | S3 buckets, DynamoDB tables, CloudFront distributions, API Gateway |
| Authentication system | Cognito User Pool, registration, login, email verification |
| Frontend scaffold | Next.js application with authentication UI, product catalog |
| CI/CD pipeline | GitHub Actions build, test, deploy pipeline |
| Development environment | Fully operational dev environment |

## Phase 2 — Payment, Content Delivery & Core Features

**Objective:** Implement payment processing, content delivery, and primary user features.

| Deliverable | Description |
|---|---|
| Payment integration | Midtrans integration, webhook processing, automated access granting |
| Content delivery system | Signed URL generation, content access verification |
| Content migration | Initial product content migrated and validated |
| User dashboard | Purchased products, recent materials, account summary |
| Learning material viewer | PDF, image, and audio material rendering |
| Quiz content viewer | Client-side quiz rendering from JSON |
| Profile management | Display name editing, payment history |

## Phase 3 — Production Hardening & Launch

**Objective:** Security hardening, performance optimisation, and production launch.

| Deliverable | Description |
|---|---|
| Security hardening | Rate limiting, CORS tightening, input validation review |
| Performance optimisation | CDN caching tuning, Lambda cold start optimisation |
| Production environment | Full production infrastructure deployment |
| Content validation | Complete content migration validation and integrity verification |
| UAT execution | Full user acceptance testing cycle |
| Monitoring & alerting | CloudWatch dashboards, alarms, budget alerts configured |
| Production launch | DNS cutover, production deployment, post-launch monitoring |

---

# 18. Project Governance

## 18.1 Team Structure

| Role | Responsibility |
|---|---|
| **Product Owner** | Business requirements, product decisions, acceptance criteria |
| **Technical Architect** | Architecture design, technology decisions, technical review |
| **Full-Stack Developer** | Frontend and backend implementation |
| **DevOps Engineer** | CI/CD pipeline, infrastructure provisioning, monitoring |
| **QA / Tester** | Test execution, quality assurance, defect tracking |

## 18.2 Communication Flow

| Communication Type | Frequency | Participants | Medium |
|---|---|---|---|
| Sprint planning | Bi-weekly | All team members | Video conference |
| Daily standup | Daily | Development team | Async (text-based) |
| Technical review | As needed | Architect + Developers | Video conference or pull request review |
| Stakeholder update | Bi-weekly | Product Owner + Architect | Written report |
| Incident response | As needed | Relevant team members | Immediate communication channel |

## 18.3 Decision Authority

| Decision Domain | Authority |
|---|---|
| Business requirements & product scope | Product Owner |
| Architecture & technology decisions | Technical Architect |
| Implementation approach | Development team (with Architect review) |
| Release approval | Product Owner + Technical Architect |
| Incident response | On-call engineer (escalation to Architect) |

## 18.4 Documentation Standards

| Artifact | Maintenance Responsibility |
|---|---|
| Phase documents (Phase 0–5) | Product Owner / Technical Architect |
| Technical Proposal | Technical Architect |
| API documentation | Development team |
| Infrastructure documentation | DevOps Engineer |
| Test documentation | QA / Tester |
| Runbooks | DevOps Engineer |

---

# 19. Maintenance and Support Model

## 19.1 Support Structure

The platform support model operates in three tiers:

| Tier | Scope | Responsibility |
|---|---|---|
| **Tier 1 — Monitoring** | Automated monitoring, alerting, and log analysis | CloudWatch alarms, automated health checks |
| **Tier 2 — Operational** | Incident triage, routine operational tasks, deployments | DevOps Engineer / Development team |
| **Tier 3 — Engineering** | Root cause analysis, bug fixes, architectural changes | Development team / Technical Architect |

## 19.2 Service Level Agreements

| Metric | Target |
|---|---|
| **Uptime** | 99.5% |
| **API Response Time** | < 500 ms (p95) |
| **Content Load Time** | < 2 seconds |
| **Recovery Time Objective (RTO)** | 4 hours |
| **Recovery Point Objective (RPO)** | 15 minutes |

## 19.3 Incident Handling

### Incident Severity Classification

| Severity | Definition | Response Time | Resolution Target |
|---|---|---|---|
| **Critical (P1)** | Platform fully unavailable, payment processing failure | 30 minutes | 4 hours |
| **High (P2)** | Major feature degraded (e.g., content access failure) | 1 hour | 8 hours |
| **Medium (P3)** | Minor feature issue, non-blocking workaround exists | 4 hours | 24 hours |
| **Low (P4)** | Cosmetic issue, enhancement request | 24 hours | Next scheduled release |

### Incident Response Process

```
DETECT → TRIAGE → DIAGNOSE → RESOLVE → POST-MORTEM
```

1. **Detect:** CloudWatch alarm fires or user report received
2. **Triage:** Classify severity, assign to appropriate tier
3. **Diagnose:** Analyse CloudWatch Logs, identify root cause
4. **Resolve:** Implement fix, deploy through CI/CD pipeline, verify resolution
5. **Post-Mortem:** Document root cause, contributing factors, and preventive actions

## 19.4 Routine Maintenance

| Activity | Frequency | Description |
|---|---|---|
| Dependency updates | Monthly | Review and update third-party dependencies |
| Security patching | As needed | Apply security patches for identified vulnerabilities |
| Cost review | Monthly | Review AWS spending against budget targets |
| Log review | Weekly | Review error logs and security events |
| Backup verification | Monthly | Verify backup bucket integrity and recoverability |
| Certificate renewal | Automated | ACM handles automatic SSL certificate renewal |

## 19.5 Disaster Recovery

| Component | Recovery Strategy |
|---|---|
| Frontend (S3) | Redeploy from CI/CD pipeline |
| Backend (Lambda) | Redeploy from CI/CD pipeline |
| Database (DynamoDB) | Point-in-time recovery (PITR) |
| Content (S3) | Restore from backup bucket or S3 versioning |
| Infrastructure | Terraform re-apply from version-controlled state |

---

# Appendix A — Product Catalog Reference

| Product ID | Name | Price (IDR) | Access Type |
|---|---|---|---|
| PRODUCT_001 | KISI KISI JFT LENGKAP | 40,000 | Lifetime |
| PRODUCT_002 | JFT APRIL - MEI 2026 | 25,000 | Lifetime |
| PRODUCT_003 | LATSOL KANJI 350 | 10,000 | Lifetime |
| PRODUCT_004 | LATSOL HIRAGANA KATAKANA | 5,000 | Lifetime |
| PRODUCT_005 | Subscription (Future) | TBD | Subscription |

---

# Appendix B — Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend Framework | Next.js (Static Export) | UI rendering |
| Frontend Hosting | S3 + CloudFront | Static site delivery |
| Backend Compute | AWS Lambda (Node.js 20.x) | Business logic |
| API Management | AWS API Gateway (REST) | Request routing |
| Authentication | AWS Cognito | Identity management |
| Database | Amazon DynamoDB (On-Demand) | Data storage |
| Object Storage | Amazon S3 | Content and asset storage |
| CDN | Amazon CloudFront | Content delivery, signed URLs |
| DNS | Amazon Route 53 | Domain management |
| SSL/TLS | AWS ACM | Certificate management |
| Monitoring | Amazon CloudWatch | Logging, metrics, alarms |
| Cost Management | AWS Budgets | Spending control |
| Payment Gateway | Midtrans | Payment processing |
| IaC | Terraform | Infrastructure provisioning |
| CI/CD | GitHub Actions | Build, test, deploy automation |
| Version Control | GitHub | Source code management |

---

# Appendix C — Error Response Standards

| Error Condition | HTTP Status | Message |
|---|---|---|
| Invalid payment | 400 | Payment verification failed |
| Unauthorised access | 401 | Access denied |
| Forbidden (no product access) | 403 | Product access required |
| Missing content | 404 | Content not found |
| Server error | 500 | Internal server error |

---

**END OF TECHNICAL PROPOSAL DOCUMENT**
