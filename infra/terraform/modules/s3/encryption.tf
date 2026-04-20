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
  # Create one resource for every bucket in the normalized map.
  # each.key  = the logical bucket name (e.g. "content")
  # each.value = the normalized bucket object from locals.tf
  for_each = local.normalized_buckets

  # Link this configuration to the bucket created in main.tf.
  # We reference aws_s3_bucket.this[each.key].id (the bucket name) rather
  # than the bucket name string directly so that Terraform knows there is a
  # dependency between these two resources.  If the bucket is recreated,
  # Terraform will also recreate the encryption configuration.
  bucket = aws_s3_bucket.this[each.key].id

  rule {
    apply_server_side_encryption_by_default {
      # The encryption algorithm.  Comes from the normalized encryption object.
      # Possible values and when to use each:
      #   AES256   — AWS-managed keys (SSE-S3).  Free, no setup needed.
      #              Good default for most buckets.
      #   aws:kms  — AWS KMS customer-managed keys (SSE-KMS).  More control:
      #              audit trails, key rotation, cross-account access.
      #              Requires kms_master_key_id to be set.
      sse_algorithm = each.value.encryption.sse_algorithm

      # KMS key ARN.  Only set when the algorithm is "aws:kms".
      # The ternary expression makes explicit what would otherwise be a
      # confusing null-vs-empty-string distinction in the AWS provider:
      #   if using KMS → pass the ARN
      #   otherwise    → pass null so the provider omits the attribute
      kms_master_key_id = each.value.encryption.sse_algorithm == "aws:kms" ? each.value.encryption.kms_master_key_id : null
    }

    # S3 Bucket Key reduces the *number of requests made to AWS KMS*.
    # Normally S3 calls KMS once per object upload.  With Bucket Key enabled,
    # S3 uses a short-lived data key cached at the bucket level and only calls
    # KMS once per key rotation period.  This can reduce KMS costs by up to 99%
    # on write-heavy workloads.  It has no effect when using AES256.
    #
    # Only set when using KMS; null tells the provider to omit the attribute.
    bucket_key_enabled = each.value.encryption.sse_algorithm == "aws:kms" ? each.value.encryption.bucket_key_enabled : null
  }
}
