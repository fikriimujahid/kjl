# PHASE 0 — BUSINESS & PRODUCT FOUNDATION

**Project:** KeJepangDulu Web eLearning Platform
**Version:** 0.1 (Draft)
**Status:** Editable
**Prepared For:** Product Owner / Technical Architect / AI Agent
**Last Updated:** 2026-04-09

---

# 0. OBJECTIVE

This document defines the **initial business and product foundation** for migrating the current KeJepangDulu learning system into a scalable web-based eLearning platform.

The purpose of this phase is to:

- Clarify unclear business rules
- Standardize product structure
- Define access policies
- Define payment logic
- Prepare content migration strategy
- Enable technical architecture design
- Reduce long-term AWS cost risk

This document is designed to be:

- Human readable
- Machine readable
- AI-agent compatible
- Extendable

---

# 1. CURRENT BUSINESS OVERVIEW

## 1.1 Current Platform

```yaml
Platform Type: Manual + Clicky Sales + Google Forms + WhatsApp

Delivery Method:
  Paid users receive:
    - Google Form quizzes
    - PDF files
    - Audio files
    - Images

Approval Method: Manual approval after payment

Access Model: Lifetime access per product
```

---
## 1.2 Current Product List

### PRODUCT_001

```yaml
product_id: PRODUCT_001
name: KISI KISI JFT LENGKAP, MATERI, LATSOL JFT + LATSOL KANJI
price: 40000
currency: IDR
access_type: lifetime
url: https://clicky.id/kejepangdulu/jft-lengkap-materi-latsol-jft-latsol-kanji
description:
  - latsol kisi kisi jft 20tipe soal beserta dengan pdfnya, didalam soalnya ada audoi choukainya juga.
  - kotoba irodori
  - kotoba n5-n4
  - kanji jlpt dan jft
  - bunpou n5-n3
  - modul kata sifat
  - kata kerja 500+
  - modul keguanaan partikel LENGKAP
  - soal n5
  - latsol jlpt n4
  - latsol 350 kanji n4
```

---

### PRODUCT_002

```yaml
product_id: PRODUCT_002
name: KISI KISI JFT APRIL - MEI 2026 (LATSOL JFT + PEMBAHASAN) CHOUKAI
price: 25000
currency: IDR
access_type: lifetime
url: https://clicky.id/kejepangdulu/jft-april-mei-2026-latsol-jft-pembahasan-choukai
description:
  - latsol jft april mei 2026 ADA CHOUKAINYA
  - pdf pembahasa jft april mei 2026
  - modul bunpou n4 dan n3
  - modul kata sifat
```

---

### PRODUCT_003

```yaml
product_id: PRODUCT_003
name: LATSOL KANJI (350 KANJI) DAN HAFALAN KANJI 350 N4
price: 10000
currency: IDR
access_type: lifetime
url: https://clicky.id/kejepangdulu/latsol-kanji-350-kanji-dan-hafalan-kanji-350-n4
description: latsol kanji googl form dan isinya ada 350 soal, berguna sekali untuk kalian hanya mau hafalan kanji saja
```

---

### PRODUCT_004

```yaml
product_id: PRODUCT_004
name: Latsol Hiragana Katakana
price: 5000
currency: IDR
access_type: lifetime
url: https://clicky.id/kejepangdulu/latsol-hiragana-katakana
description: COCOK UNTUK PEMULA, BISA JAWAB INI, BURU BURU MASUK LPK
```

---

## 1.3 Current Community Channel

```yaml
type: whatsapp_channel
url: https://whatsapp.com/channel/0029Vb7nDpbFi8xjCUNoIb1L
purpose:
  - Community announcements
  - User support
```

---

# 2. TARGET BUSINESS MODEL (PROPOSED DEFAULT)

This section defines a **recommended future model**.
Values can be adjusted later.

---

## 2.1 Access Model Strategy

```yaml
model_type: hybrid

rules:
  core_products: lifetime access
  premium_updates: subscription
  future_feature:
    optional_membership: true
```

---

## 2.2 Download Policy

```yaml
download_policy: all content is online only, no downloads allowed
```

## 2.3 Quiz Access Model

```yaml
quiz_access:

  delivery_method: online_only

  randomization:
    enabled: false

  attempt_limit:
    default: unlimited

  time_limit:
    optional: true
```

---

# 3. TARGET PRODUCT MODEL

```yaml
product_types:
  - lifetime_product
  - subscription_product

products:

  PRODUCT_001:
    name: KISI KISI JFT LENGKAP
    price: 40000
    currency: IDR
    access_type: lifetime
    features:
      - learning_material
      - quiz

  PRODUCT_002:
    name: JFT APRIL - MEI 2026
    price: 25000
    currency: IDR
    access_type: lifetime
    features:
      - learning_material
      - quiz

  PRODUCT_003:
    name: LATSOL KANJI 350
    price: 10000
    currency: IDR
    access_type: lifetime
    features:
      - learning_material
      - quiz

  PRODUCT_004:
    name: LATSOL HIRAGANA KATAKANA
    price: 5000
    currency: IDR
    access_type: lifetime
    features:
      - learning_material
      - quiz

  PRODUCT_005:
    name: Subscription (Future)
    price: TBD
    currency: IDR
    access_type: subscription
    features:
      - learning_material
      - quiz
      - practice_mode
      - exam_mode
    status: future
```
# 4. PAYMENT POLICY

---

## 4.1 Payment Provider

```yaml
payment_gateway:
  provider: Midtrans
  mode:
    - sandbox
    - production
```

---

## 4.2 Payment Flow

```yaml
payment_flow:

  step_1: user_select_product
  step_2: create_midtrans_order
  step_3: user_complete_payment
  step_4: midtrans_webhook_received
  step_5: system_verify_signature
  step_6: grant_product_access
```

---

## 4.3 Manual Approval Removal

```yaml
manual_approval:
  current: true
  future: false

replacement: automated_webhook_validation
```

---

## 4.4 Refund Policy

```yaml
refund_policy:
  allowed: false
  optional_future:
    manual_review: true
```

---

# 5. CONTENT INVENTORY REQUIREMENT

This section must be completed before development.

---

## 5.1 Content Types

```yaml
content_types:
  - quiz_questions
  - images
  - audio
  - pdf
```

---

## 5.2 Content Master Inventory Structure

```yaml
content_inventory:

  topic_id:
  topic_name:
  total_questions:

  assets:
    images:
      count:
    audio:
      count:
    pdf:
      count:
```

---

## 5.3 Google Form Migration

```yaml
source:
  type: google_form

action_required:
  - export_questions
  - convert_to_json
  - validate_structure
```

---

# 6. USER MODEL

---

## 6.1 User Types

```yaml
user_roles:
  - guest
  - registered_user
```

---

## 6.2 User Access Rules

```yaml
user_access:

  guest:
    view_products: true
    view_product_detail: true
    register_account: true
    login: true

  registered_user:
    purchase_product: true
    access_dashboard: true
    access_learning_material:
      requires_product_purchase: true
    access_quiz:
      requires_product_purchase: true
```

---

# 7. SUCCESS METRICS

---

## 7.1 User Targets

```yaml
target_users:
  month_1: 100
  month_3: 500
  month_6: 2000
```

---

## 7.2 Revenue Targets

```yaml
target_revenue:
  month_1: 2000000
  month_3: 10000000
  month_6: 50000000
  currency: IDR
```

---

## 7.3 Cost Targets

```yaml
aws_budget:
  monthly_limit: 20 USD
  alert_threshold: 80 percent
```

---

# 8. CONTENT SECURITY POLICY

---

## 8.1 Anti-Piracy Strategy

```yaml
security_rules:
  no_public_json: true
  signed_urls:
    enabled: true
  randomized_questions:
    enabled: true
```

---

## 8.2 Asset Protection

```yaml
asset_rules:
  s3_access: private
  cloudfront:
    signed_access: true
```

---

# 9. DATA RETENTION POLICY

---

## 9.1 User Data

```yaml
retain:
  user_data:
    duration: unlimited
  quiz_results:
    duration: unlimited
```

---

## 9.2 Payment Data

```yaml
retain:
  payment_records:
    duration: 7 years
```

---

# END OF PHASE 0 DOCUMENT