# ---------------------------------------------------------------------------
# locals.tf
#
# locals{} blocks define computed values that are reused across multiple
# resource files.  Think of them as private, calculated "constants" for this
# module.  They are recomputed on every plan/apply but never stored in state.
#
# The primary purpose of this file is NORMALIZATION:
#   var.buckets accepts many optional fields with different names and shapes.
#   This file converts that flexible input into a single, uniform internal
#   model so that every other .tf file works with a consistent structure.
# ---------------------------------------------------------------------------

locals {
  # -------------------------------------------------------------------------
  # default_bucket_actions
  # -------------------------------------------------------------------------
  # These are the S3 IAM actions that operate at the *bucket* level.
  # The IAM resource for these actions is the bucket ARN itself
  # (e.g. "arn:aws:s3:::my-bucket"), NOT individual objects inside it.
  #
  # s3:GetBucketLocation     — look up which region the bucket lives in.
  #                            Many AWS SDKs call this before listing objects.
  # s3:ListBucket            — list the objects inside the bucket.
  # s3:ListBucketMultipartUploads — list in-progress multipart uploads.
  #
  # These defaults are used when the caller does not supply custom
  # iam_policy.bucket_actions for a bucket.
  default_bucket_actions = [
    "s3:GetBucketLocation",
    "s3:ListBucket",
    "s3:ListBucketMultipartUploads"
  ]

  # -------------------------------------------------------------------------
  # default_object_actions
  # -------------------------------------------------------------------------
  # These are the S3 IAM actions that operate at the *object* level.
  # The IAM resource for these actions must be the bucket ARN plus "/*"
  # (e.g. "arn:aws:s3:::my-bucket/*"), meaning "all objects in the bucket".
  #
  # s3:AbortMultipartUpload — cancel incomplete uploads (avoids storage waste).
  # s3:DeleteObject         — remove objects from the bucket.
  # s3:GetObject            — read / download objects.
  # s3:PutObject            — upload / create / overwrite objects.
  #
  # Together with default_bucket_actions these form a standard read/write
  # (RW) permission set — sufficient for most application workloads.
  default_object_actions = [
    "s3:AbortMultipartUpload",
    "s3:DeleteObject",
    "s3:GetObject",
    "s3:PutObject"
  ]

  # -------------------------------------------------------------------------
  # default_iam_policy_names
  # -------------------------------------------------------------------------
  # When a caller does not provide an explicit IAM policy name, this local
  # generates a safe, deterministic name automatically.
  #
  # The name format is:  s3-rw-<sanitized-bucket-name>-<short-hash>
  #
  # Why the hash suffix?
  #   IAM policy names must be unique within an AWS account.  A pure bucket
  #   name could collide if two different Terraform workspaces manage buckets
  #   with similar names.  The 8-character SHA-1 prefix of the bucket name
  #   makes collisions practically impossible.
  #
  # Steps:
  #   1. coalesce(bucket_name, bucket_key) — use explicit name or fall back to map key
  #   2. replace(...)    — swap any characters that IAM does not allow with "-"
  #   3. substr(..., 0, 90) — truncate to 90 chars (IAM limit is 128; we leave
  #                          room for the "s3-rw-" prefix and the hash suffix)
  #   4. sha1(...)       — compute a 40-character hex digest of the full name
  #   5. substr(..., 0, 8) — take only the first 8 hex chars (enough for uniqueness)
  default_iam_policy_names = {
    for bucket_key, bucket in var.buckets :
    bucket_key => format(
      "s3-rw-%s-%s",
      substr(
        replace(coalesce(try(bucket.bucket_name, null), bucket_key), "/[^0-9A-Za-z+=,.@_-]/", "-"),
        0,
        90
      ),
      substr(sha1(coalesce(try(bucket.bucket_name, null), bucket_key)), 0, 8)
    )
  }

  # -------------------------------------------------------------------------
  # normalized_buckets
  # -------------------------------------------------------------------------
  # This is the heart of the module.  It transforms var.buckets (which is a
  # flexible, caller-supplied map with many optional fields) into a strict,
  # uniform map that every resource file can rely on.
  #
  # Why normalize?
  #   var.buckets supports two ways to configure versioning, two ways to create
  #   IAM policies, and an optional lifecycle shortcut (lifecycle_days).  If
  #   every resource file handled these variations independently, the code
  #   would be repetitive and fragile.  By resolving everything here once,
  #   the resource files stay simple and readable.
  #
  # The result is a map where each value has the same shape:
  #   { bucket_name, force_destroy, object_ownership, versioning_enabled,
  #     lifecycle_rules, encryption, public_access_block,
  #     attach_tls_only_policy, additional_policy_documents,
  #     iam_policy{create,name,bucket_actions,object_actions}, tags }
  #
  # Every field is always present — no more try() or null checks in resource files.
  normalized_buckets = {
    for bucket_key, bucket in var.buckets : bucket_key => {
      # Use the explicit bucket_name if provided; otherwise fall back to the
      # map key.  coalesce() returns the first non-null, non-empty value.
      bucket_name = coalesce(try(bucket.bucket_name, null), bucket_key)

      # Preserve force_destroy as-is; default to false (safe for production).
      force_destroy = try(bucket.force_destroy, false)

      # Map the human-friendly "ownership" field to the AWS API attribute name
      # "object_ownership" used in aws_s3_bucket_ownership_controls.
      object_ownership = try(bucket.ownership, "BucketOwnerEnforced")

      # Resolve versioning from three possible sources (highest priority first):
      #   1. bucket.versioning.enabled (the new nested block form)
      #   2. bucket.versioning_enabled (the old flat bool form)
      #   3. true (hardcoded safe default — always enable versioning)
      # coalesce() picks the first non-null value in the list.
      versioning_enabled = coalesce(
        try(bucket.versioning.enabled, null),
        try(bucket.versioning_enabled, null),
        true
      )

      # -------------------------------------------------------------------
      # lifecycle_rules normalization
      # -------------------------------------------------------------------
      # This is a conditional expression (Terraform ternary):
      #   condition ? value_if_true : value_if_false
      #
      # BRANCH A — caller provided lifecycle_rules list (new, detailed form)
      #   Normalize each rule: fill in missing ids, ensure all required
      #   fields are present so that lifecycle.tf can use them without
      #   null-checking every field.
      #
      # BRANCH B — caller provided lifecycle_days (legacy shortcut)
      #   Convert the single integer into a minimal lifecycle_rules list
      #   with one entry named "expire-objects" so that lifecycle.tf does
      #   not need any special legacy handling.
      #
      # BRANCH C — neither was provided
      #   Return an empty list.  lifecycle.tf uses buckets_with_lifecycle,
      #   which filters out entries with no lifecycle rules, so this bucket
      #   will simply have no lifecycle resource created.
      lifecycle_rules = length(try(bucket.lifecycle_rules, [])) > 0 ? [
        for index, rule in try(bucket.lifecycle_rules, []) : {
          # Auto-generate rule IDs if the caller did not supply them.
          # format("rule-%02d", index+1) gives "rule-01", "rule-02", etc.
          # The %02d ensures at least two digits, which sorts correctly.
          id = coalesce(try(rule.id, null), format("rule-%02d", index + 1))

          # default true: rules are active unless explicitly disabled
          enabled = try(rule.enabled, true)

          # Scope rules to a key prefix, or null for bucket-wide rules.
          prefix = try(rule.prefix, null)

          # Tags for the filter: empty map {} means no tag filter.
          tags = try(rule.tags, {})

          # Null means "do not add this expiration block" to the rule.
          expiration_days                        = try(rule.expiration_days, null)
          noncurrent_version_expiration_days     = try(rule.noncurrent_version_expiration_days, null)
          abort_incomplete_multipart_upload_days = try(rule.abort_incomplete_multipart_upload_days, null)

          # Normalize transitions: copy days + storage_class fields into a
          # uniform list.  lifecycle.tf iterates this list with for_each.
          transitions = [
            for transition in try(rule.transitions, []) : {
              days          = transition.days
              storage_class = transition.storage_class
            }
          ]
          noncurrent_version_transitions = [
            for transition in try(rule.noncurrent_version_transitions, []) : {
              noncurrent_days = transition.noncurrent_days
              storage_class   = transition.storage_class
            }
          ]
        }
        ] : (
        # BRANCH B: convert the legacy lifecycle_days shortcut into a
        # single-rule list only when lifecycle_days is set and > 0.
        try(bucket.lifecycle_days, null) != null && try(bucket.lifecycle_days, 0) > 0 ? [
          {
            id                                     = "expire-objects"
            enabled                                = true
            prefix                                 = null
            tags                                   = {}
            expiration_days                        = bucket.lifecycle_days
            noncurrent_version_expiration_days     = null
            abort_incomplete_multipart_upload_days = null
            transitions                            = []
            noncurrent_version_transitions         = []
          }
        ] : [] # BRANCH C: no lifecycle configured
      )

      # -------------------------------------------------------------------
      # encryption normalization
      # -------------------------------------------------------------------
      # Ensure all three encryption fields are always present.
      # try(field, default) is used because the caller may not have set the
      # encryption block at all.  If the block is absent, try() returns the
      # default instead of crashing.
      encryption = {
        # Default to AES256 (AWS-managed keys, zero cost, zero config).
        sse_algorithm = try(bucket.encryption.sse_algorithm, "AES256")
        # KMS key ARN; null when using AES256 (encryption.tf ignores it).
        kms_master_key_id = try(bucket.encryption.kms_master_key_id, null)
        # S3 Bucket Key reduces KMS API calls when using aws:kms.
        bucket_key_enabled = try(bucket.encryption.bucket_key_enabled, true)
      }

      # -------------------------------------------------------------------
      # public_access_block normalization
      # -------------------------------------------------------------------
      # Default all four settings to true (fully private bucket).
      # The caller can override specific flags via the public_access_block
      # block in their var.buckets entry.
      public_access_block = {
        block_public_acls       = try(bucket.public_access_block.block_public_acls, true)
        block_public_policy     = try(bucket.public_access_block.block_public_policy, true)
        ignore_public_acls      = try(bucket.public_access_block.ignore_public_acls, true)
        restrict_public_buckets = try(bucket.public_access_block.restrict_public_buckets, true)
      }

      # Rename policy_documents to additional_policy_documents for clarity.
      # security.tf merges these with the TLS-only statement.
      attach_tls_only_policy      = try(bucket.attach_tls_only_policy, true)
      additional_policy_documents = try(bucket.policy_documents, [])

      # -------------------------------------------------------------------
      # iam_policy normalization
      # -------------------------------------------------------------------
      # Resolves the IAM policy create flag and name from three sources.
      iam_policy = {
        # Determine whether to create the IAM policy.
        # Priority (first non-null wins):
        #   1. bucket.iam_policy.create  — per-bucket nested form (newest)
        #   2. bucket.create_iam_policy  — per-bucket flat form (compat)
        #   3. var.create_iam_policies   — module-level default
        create = coalesce(
          try(bucket.iam_policy.create, null),
          try(bucket.create_iam_policy, null),
          var.create_iam_policies
        )

        # Resolve the policy name.  Priority (first non-null wins):
        #   1. bucket.iam_policy.name  — nested form
        #   2. bucket.iam_policy_name  — flat form (compat)
        #   3. auto-generated name from default_iam_policy_names
        name = coalesce(
          try(bucket.iam_policy.name, null),
          try(bucket.iam_policy_name, null),
          local.default_iam_policy_names[bucket_key]
        )

        # Use custom actions if provided (non-empty), otherwise use defaults.
        # length(...) > 0 avoids overwriting with an accidental empty list.
        bucket_actions = length(try(bucket.iam_policy.bucket_actions, [])) > 0 ? try(bucket.iam_policy.bucket_actions, []) : local.default_bucket_actions
        object_actions = length(try(bucket.iam_policy.object_actions, [])) > 0 ? try(bucket.iam_policy.object_actions, []) : local.default_object_actions
      }

      # Merge module-level tags with per-bucket tags.
      # Per-bucket tags (right side) override module tags (left side)
      # when both define the same key.
      tags = merge(var.tags, try(bucket.tags, {}))
    }
  }

  # -------------------------------------------------------------------------
  # buckets_with_lifecycle
  # -------------------------------------------------------------------------
  # Filtered sub-map: only buckets that have at least one lifecycle rule.
  # lifecycle.tf uses this map as its for_each source so that
  # aws_s3_bucket_lifecycle_configuration resources are only created for
  # buckets that actually need lifecycle management.
  #
  # Without this filter, Terraform would try to create empty lifecycle
  # configurations for every bucket, which the AWS API rejects.
  buckets_with_lifecycle = {
    for bucket_key, bucket in local.normalized_buckets :
    bucket_key => bucket if length(bucket.lifecycle_rules) > 0
  }

  # -------------------------------------------------------------------------
  # buckets_with_policy
  # -------------------------------------------------------------------------
  # Filtered sub-map: only buckets that need a bucket policy attached.
  # A bucket needs a policy if either (or both) of these is true:
  #   • attach_tls_only_policy is true — need the DenyInsecureTransport rule
  #   • additional_policy_documents is non-empty — caller supplied extra JSON
  # security.tf iterates this map to create the merged bucket policies.
  buckets_with_policy = {
    for bucket_key, bucket in local.normalized_buckets :
    bucket_key => bucket if bucket.attach_tls_only_policy || length(bucket.additional_policy_documents) > 0
  }

  # -------------------------------------------------------------------------
  # buckets_with_iam_policy
  # -------------------------------------------------------------------------
  # Filtered sub-map: only buckets that should have a standalone IAM policy
  # created.  iam.tf iterates this map to build the per-bucket IAM policies.
  #
  # The iam_policy.create flag is already resolved in normalized_buckets,
  # so the filter here is a simple equality check.
  buckets_with_iam_policy = {
    for bucket_key, bucket in local.normalized_buckets :
    bucket_key => bucket if bucket.iam_policy.create
  }
}