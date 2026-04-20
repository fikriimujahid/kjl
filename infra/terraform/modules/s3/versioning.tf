# ---------------------------------------------------------------------------
# versioning.tf
#
# Configures versioning on every bucket created by this module.
#
# What is versioning?
#   When versioning is enabled, S3 keeps a full history of every object.
#   Overwriting or deleting an object does not remove previous copies —
#   instead a new version is stored.  This protects against:
#     • Accidental deletes — you can restore the previous version.
#     • Overwrite mistakes — previous content is never lost.
#     • Ransomware — older versions survive even if the latest is corrupted.
#
# Cost note:
#   Versioned objects incur storage charges for every version.  Use lifecycle
#   rules (lifecycle.tf) to automatically remove old versions after N days.
# ---------------------------------------------------------------------------

# aws_s3_bucket_versioning.this
# ------------------------------
# One versioning configuration per bucket.
resource "aws_s3_bucket_versioning" "this" {
  # Create one resource for every normalized bucket, using the same map keys
  # as aws_s3_bucket.this so that each.key always refers to the same bucket.
  for_each = local.normalized_buckets

  # Link to the bucket created in main.tf (see encryption.tf for why we
  # reference .id instead of interpolating the name string directly).
  bucket = aws_s3_bucket.this[each.key].id

  versioning_configuration {
    # Convert the boolean versioning_enabled flag into the string value
    # that the AWS API expects.
    #
    # "Enabled"   — new uploads get version IDs; all previous versions kept.
    # "Suspended" — new uploads do NOT get version IDs; previous versions
    #               are preserved but no new versions are created.
    #
    # Note: you can go from Enabled → Suspended without data loss.
    # You cannot go from Suspended → "off" (AWS has no way to fully disable
    # versioning once it has been enabled on a bucket).
    status = each.value.versioning_enabled ? "Enabled" : "Suspended"
  }
}
