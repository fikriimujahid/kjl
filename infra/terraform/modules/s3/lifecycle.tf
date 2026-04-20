# ---------------------------------------------------------------------------
# lifecycle.tf
#
# Configures S3 Lifecycle rules on buckets that have at least one rule defined.
#
# What are lifecycle rules?
#   Rules that tell S3 to automatically take action on objects based on age:
#     • Transition — move objects to a cheaper storage class after N days
#     • Expiration — delete objects (or old versions) after N days
#     • Abort uploads — cancel incomplete multipart uploads after N days
#
# This file uses "dynamic blocks" extensively.  A dynamic block generates
# zero or more nested configuration blocks at plan/apply time based on a
# for_each expression.  If the condition is empty/false, the block is omitted
# entirely — exactly as if you had never written it.
# ---------------------------------------------------------------------------

# aws_s3_bucket_lifecycle_configuration.this
# ------------------------------------------
# Only created for buckets that have lifecycle_rules.length > 0
# (enforced by using buckets_with_lifecycle as the for_each source).
resource "aws_s3_bucket_lifecycle_configuration" "this" {
  # buckets_with_lifecycle is a filtered map (defined in locals.tf)
  # containing only buckets that have at least one lifecycle rule.
  for_each = local.buckets_with_lifecycle

  bucket = aws_s3_bucket.this[each.key].id

  # -------------------------------------------------------------------------
  # dynamic "rule"
  # -------------------------------------------------------------------------
  # Generates one <rule> block for every entry in the bucket's lifecycle_rules
  # list.  Each rule in the list becomes a separate named rule in S3.
  #
  # rule.value is the current entry from each.value.lifecycle_rules.
  # Inside the content block, every field is accessed via rule.value.*
  dynamic "rule" {
    for_each = each.value.lifecycle_rules

    content {
      # AWS requires a unique ID per rule.  Set by the caller or auto-generated
      # by locals.tf ("rule-01", "rule-02", etc.).
      id = rule.value.id

      # "Enabled" activates the rule; "Disabled" pauses it without deleting.
      # This is useful for temporarily turning off a rule without losing config.
      status = rule.value.enabled ? "Enabled" : "Disabled"

      # -----------------------------------------------------------------------
      # filter block
      # -----------------------------------------------------------------------
      # Lifecycle rules can target all objects or just a subset.
      # The filter can match by key prefix, by object tags, or both.
      #
      # There are two cases:
      #   Case 1 — NO tags: use a simple prefix filter.
      #     The prefix field is set directly on the filter block.
      #     A null prefix means the rule applies to ALL objects in the bucket.
      #   Case 2 — tags present: use the nested "and" block.
      #     The "and" block requires BOTH prefix AND all specified tags to match.
      filter {
        # Case 1: Set the top-level prefix only when there are no tags.
        # When tags are present, prefix goes inside the "and" block instead.
        prefix = length(rule.value.tags) == 0 ? rule.value.prefix : null

        # -----------------------------------------------------------------------
        # dynamic "and" block (nested inside filter)
        # -----------------------------------------------------------------------
        # Only generated when this rule has tag-based filtering.
        # for_each = [rule.value] is a trick to produce exactly one block
        # when the condition is true, or zero blocks when false.
        dynamic "and" {
          for_each = length(rule.value.tags) > 0 ? [rule.value] : []

          content {
            # When using the "and" block, prefix goes here (can be null).
            prefix = rule.value.prefix
            # All of these tags must be present on the object for the rule to match.
            tags = rule.value.tags
          }
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "expiration"
      # -----------------------------------------------------------------------
      # Delete the CURRENT version of an object after expiration_days days.
      # Only generated when expiration_days is not null.
      # for_each on a single value (wrapped in a list) is how you conditionally
      # include or exclude a block without using count.
      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [rule.value.expiration_days] : []

        content {
          # expiration.value is the days integer from the wrapping list.
          days = expiration.value
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "transition"
      # -----------------------------------------------------------------------
      # Move the current version of an object to a cheaper storage class
      # after a set number of days.  One block is generated per transition
      # entry.  Common examples:
      #   30 days → STANDARD_IA  (infrequent access, cheaper for cold data)
      #   90 days → GLACIER      (archival, very cheap but minutes-to-hours retrieval)
      dynamic "transition" {
        for_each = rule.value.transitions

        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "noncurrent_version_expiration"
      # -----------------------------------------------------------------------
      # Delete OLD (non-current) versions of objects after N days.
      # "Non-current" means the object was overwritten or deleted while
      # versioning was enabled — those older copies accumulate over time.
      # This is how you control versioning storage costs.
      # Only generated when noncurrent_version_expiration_days is not null.
      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration_days != null ? [rule.value.noncurrent_version_expiration_days] : []

        content {
          noncurrent_days = noncurrent_version_expiration.value
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "noncurrent_version_transition"
      # -----------------------------------------------------------------------
      # Move old (non-current) versions to a cheaper storage class instead of
      # deleting them.  Useful for compliance: keep old versions for a year
      # but in GLACIER to minimize cost.  One block per transition entry.
      dynamic "noncurrent_version_transition" {
        for_each = rule.value.noncurrent_version_transitions

        content {
          noncurrent_days = noncurrent_version_transition.value.noncurrent_days
          storage_class   = noncurrent_version_transition.value.storage_class
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "abort_incomplete_multipart_upload"
      # -----------------------------------------------------------------------
      # Cancel multipart uploads that were started but never completed.
      # A multipart upload is a way to upload large files in parts.  If the
      # upload is interrupted and never completed, the partial data stays in
      # S3 consuming storage (and costing money) invisibly.
      # Setting this to 7 days is a common best practice: any upload that
      # does not finish within 7 days is likely broken and can be cleaned up.
      dynamic "abort_incomplete_multipart_upload" {
        for_each = rule.value.abort_incomplete_multipart_upload_days != null ? [rule.value.abort_incomplete_multipart_upload_days] : []

        content {
          # Days after the upload was initiated before S3 cancels it.
          days_after_initiation = abort_incomplete_multipart_upload.value
        }
      }
    }
  }
}
