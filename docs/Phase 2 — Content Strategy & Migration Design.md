# PHASE 2 — CONTENT STRATEGY & MIGRATION DESIGN

Project: **KeJepangDulu Web eLearning Platform**
Version: **2.0 (Content-Driven Architecture Version)**
Status: **Active**
Depends On: **PHASE 1 — Product & System Requirements**
Last Updated: **2026-04-10**

---

# 0. OBJECTIVE

This document defines the **content strategy and migration design** required to transform existing learning content into a **secure, structured, and scalable cloud-ready format**.

This phase ensures:

* Content consistency
* Data normalization
* Secure content delivery
* Anti-piracy readiness
* Migration reliability
* Future scalability
* Low-cost storage optimization

This system is designed as:

```text
Secure Learning Content Delivery Platform
```

NOT:

```text
Quiz Processing Engine
```

Quiz content is treated as:

```text
Static structured learning content (JSON-based)
```

---

# 1. CONTENT ARCHITECTURE PRINCIPLES

---

## 1.1 Core Philosophy

Content must be:

```text
Structured
Versioned
Secure
Traceable
Portable
Scalable
```

---

## 1.2 Content Delivery Model

```text
Private Storage → Signed URL → Client Viewer
```

Flow:

```text
User Login
→ Verify Product Ownership
→ Generate Signed URL
→ Load JSON / Asset
→ Render Content
```

---

## 1.3 Content Types Supported

Primary types:

```text
Quiz Questions (JSON)

PDF Materials

Images

Audio Files
```

Future optional:

```text
Video
Interactive modules
```

---

# 2. CURRENT CONTENT SOURCE ANALYSIS

---

## 2.1 Existing Content Sources

Primary sources:

```text
Google Forms
Google Drive
WhatsApp Shared Files
Manual PDF Collections
```

---

## 2.2 Current Delivery Method

Current state:

```text
Google Form → Quiz
Google Drive → Material Download
WhatsApp → Support
Manual Payment Approval
```

Limitations:

```text
No centralized structure
No piracy protection
Manual delivery process
No scalable access control
```

---

## 2.3 Target Delivery Method

Future state:

```text
Structured JSON-based content
Private cloud storage
Signed URL delivery
Automated access control
```

---

# 3. CONTENT INVENTORY STRATEGY

---

## 3.1 Master Inventory Requirement

Before migration begins:

Create:

```text
content_inventory_master.xlsx
```

This file becomes:

```text
Single Source of Truth
```

---

## 3.2 Inventory Structure

Each product must define:

```text
product_id
product_name

topics:

  topic_id
  topic_name

sessions:

  session_id
  session_name

assets:

  images_count
  audio_count
  pdf_count

question_count
```

---

## 3.3 Inventory Validation Rules

All content must pass:

```text
No missing files
No duplicate questions
Valid file formats
Valid references
Consistent naming
```

---

# 4. QUIZ CONTENT STRUCTURE

---

## 4.1 Quiz Content Philosophy

Quiz content is:

```text
Static JSON Content
```

Not:

```text
Backend Logic
```

---

## 4.2 Standard Quiz JSON Format

```json
{
  "product_id": "PRODUCT_001",

  "topic_slug": "kanji_n4",

  "session_slug": "session_01",

  "questions": [

    {
      "question_id": "Q001",

      "question_text":
        "Apa arti dari kanji 日?",

      "image_url":
        "images/q001.png",

      "audio_url":
        null,

      "options": [

        "hari",
        "bulan",
        "api",
        "air"

      ],

      "correct_answer":
        "hari"

    }

  ]

}
```

---

## 4.3 JSON Naming Convention

```text
product_slug/topic_slug/session_slug.json
```

Example:

```text
product_001/kanji/session_01.json
```

---

## 4.4 JSON Design Rules

```text
UTF-8 encoding required
Consistent structure required
No inline HTML allowed
All assets referenced by path
Maximum file size controlled
```

---

# 5. MATERIAL CONTENT STRUCTURE

---

## 5.1 Supported Material Types

```text
PDF
Image
Audio
```

---

## 5.2 Material Naming Convention

PDF:

```text
module_01.pdf
module_02.pdf
```

Images:

```text
image_01.png
image_02.png
```

Audio:

```text
audio_01.mp3
audio_02.mp3
```

---

## 5.3 Material Delivery Method

Delivery type:

```text
Signed URL
```

Storage:

```text
Private S3 Bucket
```

---

# 6. TARGET CLOUD STORAGE STRUCTURE

---

## 6.1 Primary Storage Bucket

```text
kejepangdulu-content-private
```

---

## 6.2 Folder Structure

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

## 6.3 Backup Bucket

```text
kejepangdulu-backup
```

Purpose:

```text
Disaster recovery
Content restoration
Rollback support
```

---

# 7. CONTENT NORMALIZATION STRATEGY

---

## 7.1 Question Normalization Rules

```text
Consistent question formatting
Unicode support required
UTF-8 encoding required
Language normalization required
Remove invalid characters
```

---

## 7.2 Image Normalization Rules

```text
Format: PNG or JPG
Max resolution: 1920px
Compression required
Max size: 2MB
```

---

## 7.3 Audio Normalization Rules

```text
Format: MP3
Bitrate: ≤ 128kbps
Max size: 5MB
Compression required
```

---

## 7.4 PDF Normalization Rules

```text
Compression required
Max size: 10MB
Optional password protection
```

---

# 8. CONTENT SECURITY STRATEGY

---

## 8.1 Private Storage Policy

```text
All content stored privately
Public access disabled
Direct URL access blocked
```

---

## 8.2 Signed URL Delivery

Required:

```text
CloudFront Signed URLs
```

Used for:

```text
Quiz JSON
Images
Audio
PDF
```

---

## 8.3 Anti-Piracy Measures

Enabled:

```text
No public JSON access
No direct download links
Access control validation
URL expiration enabled
Optional watermarking
```

---

# 9. CONTENT VALIDATION PIPELINE

---

## 9.1 Validation Workflow

```text
Validate JSON structure

Validate asset references

Validate file integrity

Validate naming rules

Generate validation report
```

---

## 9.2 Validation Report Output

Generated:

```text
validation_report.json
```

Contains:

```text
Missing files
Duplicate questions
Invalid references
Format errors
```

---

# 10. CONTENT VERSIONING STRATEGY

---

## 10.1 Version Control

Enabled:

```text
S3 Versioning
```

Purpose:

```text
Rollback support
Content history
Audit tracking
```

---

## 10.2 Version Naming

```text
session_01_v1.json
session_01_v2.json
```

---

# 11. MIGRATION WORKFLOW DESIGN

---

## 11.1 Migration Pipeline

```text
Step 1 — Create content inventory

Step 2 — Export Google Forms

Step 3 — Convert to JSON

Step 4 — Normalize assets

Step 5 — Upload to S3

Step 6 — Validate upload

Step 7 — Register metadata

Step 8 — Enable secure access
```

---

## 11.2 Metadata Registration

Metadata stored:

```text
product_id
topic_slug
session_slug
question_count
asset_count
version
```

Storage:

```text
DynamoDB
```

---

# 12. BULK MIGRATION STRATEGY

---

## 12.1 Batch Rules

```text
Maximum sessions per batch: 50

Retry failed batches: enabled
```

---

## 12.2 Retry Policy

```text
Max retries: 3

Retry delay: 10 seconds
```

---

# 13. DATA BACKUP STRATEGY

---

## 13.1 Pre-Migration Backup

Required:

```text
Google Drive backup

Local backup

Offline archive
```

---

## 13.2 Post-Migration Backup

Required:

```text
S3 backup bucket replication
```

---

# 14. CONTENT MIGRATION TESTING

---

## 14.1 Content Load Testing

Validate:

```text
Quiz JSON loading

Material loading

Asset rendering
```

---

## 14.2 Functional Testing

Validate:

```text
Image rendering

Audio playback

PDF loading

Signed URL access
```

---

## 14.3 Performance Testing

Target:

```text
Content load time < 2 seconds
```

---

# 15. MIGRATION ACCEPTANCE CRITERIA

Migration is considered successful when:

```text
All products migrated

All quiz content available

All assets accessible

No missing files

Signed URL delivery working

Content renders correctly
```

---

# 16. RISKS & MITIGATION

---

## 16.1 Risk — Missing Content

Mitigation:

```text
Inventory validation required
```

---

## 16.2 Risk — Broken Links

Mitigation:

```text
Automated link validation
```

---

## 16.3 Risk — Oversized Files

Mitigation:

```text
Mandatory compression
```

---

## 16.4 Risk — Data Corruption

Mitigation:

```text
Checksum validation
```

---

# 17. OUTPUT ARTIFACTS

This phase must produce:

```text
content_inventory_master.xlsx

quiz_json_files/

asset_files/

validation_report.json

migration_log.json
```

---

# END OF PHASE 2 DOCUMENT
