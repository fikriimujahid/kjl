# ---------------------------------------------------------------------------
# encryption.tf
#
# Attaches a server-side encryption (SSE) configuration to every bucket.
# S3 requires all objects to be encrypted at rest; this resource tells S3
# which encryption method to use when an object is uploaded without an
# explicit client-side encryption header.
# ---------------------------------------------------------------------------

# aws_s3_bucket_server_side_encryption_configuration.this
# --------------------------------------------------------
# One encryption configuration per bucket (for_each = all buckets).
# This is a separate resource from aws_s3_bucket.this because the AWS
# provider splits bucket configuration across multiple resources to allow
# fine-grained lifecycle controls and to avoid update conflicts.
resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  # The module now creates one encryption configuration per module instance.
  bucket = aws_s3_bucket.this.id

  rule {
    apply_server_side_encryption_by_default {
      # The encryption algorithm.  Comes from the normalized encryption object.
      # Possible values and when to use each:
      #   AES256   — AWS-managed keys (SSE-S3).  Free, no setup needed.
      #              Good default for most buckets.
      #   aws:kms  — AWS KMS customer-managed keys (SSE-KMS).  More control:
      #              audit trails, key rotation, cross-account access.
      #              Requires kms_master_key_id to be set.
      sse_algorithm = var.encryption.sse_algorithm

      # KMS key ARN.  Only set when the algorithm is "aws:kms".
      # The ternary expression makes explicit what would otherwise be a
      # confusing null-vs-empty-string distinction in the AWS provider:
      #   if using KMS → pass the ARN
      #   otherwise    → pass null so the provider omits the attribute
      kms_master_key_id = var.encryption.sse_algorithm == "aws:kms" ? var.encryption.kms_master_key_id : null
    }

    # S3 Bucket Key reduces the *number of requests made to AWS KMS*.
    # Normally S3 calls KMS once per object upload.  With Bucket Key enabled,
    # S3 uses a short-lived data key cached at the bucket level and only calls
    # KMS once per key rotation period.  This can reduce KMS costs by up to 99%
    # on write-heavy workloads.  It has no effect when using AES256.
    bucket_key_enabled = var.encryption.bucket_key_enabled
  }
}
