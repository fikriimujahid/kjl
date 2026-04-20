# ---------------------------------------------------------------------------
# variables.tf
#
# All public inputs for this module live here.
# A "variable" is a value that the caller must or may supply when using the
# module.  Keeping all variables in one file makes it easy to read the public
# contract of the module at a glance.
#
# Terraform evaluates every validation block *before* creating any resource,
# so configuration errors are surfaced immediately — no half-applied changes.
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# variable "buckets"
# ---------------------------------------------------------------------------
# This is the main input for the module.  It accepts a map of bucket
# definitions.  One entry = one S3 bucket.
#
# The map is keyed by a *logical name* — a short identifier you choose, such
# as "content", "logs", or "backups".  That key is used as the bucket name
# unless you also set bucket_name explicitly inside the entry.
#
# Every field inside each entry is optional, so a minimal call looks like:
#
#   buckets = {
#     my-project-dev-content = {}
#   }
#
# A fully-configured entry looks like the example in example.tf.
variable "buckets" {
  description = "Map of S3 bucket definitions keyed by a logical bucket key or by the final bucket name."

  type = map(object({
    # The actual AWS bucket name.  If omitted, the map key is used instead.
    # Use this when your logical key and the real bucket name need to differ,
    # e.g. because the real name must include an account ID suffix.
    bucket_name = optional(string)

    # When true, Terraform deletes all bucket contents before destroying the
    # bucket.  Keep false in production to prevent accidental data loss.
    force_destroy = optional(bool, false)

    # Controls who "owns" objects written to the bucket.
    # BucketOwnerEnforced — bucket owner always owns every object.
    #   Use this if no external accounts write to the bucket (most common).
    # BucketOwnerPreferred — bucket owner preferred; the uploader can still
    #   keep ownership via ACL.  Use for S3 access-log delivery buckets,
    #   which need this mode.
    # ObjectWriter — the uploader owns the object.  Rarely needed.
    ownership = optional(string, "BucketOwnerEnforced")

    # Simple toggle to enable/disable versioning.  Kept for backward
    # compatibility.  If you want the newer nested form, use the versioning
    # block below.  locals.tf resolves which one to use.
    versioning_enabled = optional(bool)

    # Alternative versioning block — lets you control versioning more
    # explicitly without coupling it to a bare boolean.
    versioning = optional(object({
      # true  → versioning status = "Enabled"  (objects get version IDs)
      # false → versioning status = "Suspended" (stop creating new versions)
      enabled = optional(bool, true)
    }), {})

    # Legacy shortcut: set this to the number of days after which objects
    # expire.  A value of 0 or null means no lifecycle rule is created.
    # If you need more control (transitions to GLACIER, noncurrent-version
    # expiry, etc.) use lifecycle_rules instead.
    lifecycle_days = optional(number)

    # Full lifecycle rule list.  Each entry becomes one lifecycle rule on the
    # bucket.  If you supply this, lifecycle_days is ignored for this bucket.
    lifecycle_rules = optional(list(object({
      # Unique identifier for this rule, shown in the AWS Console.
      # If omitted, locals.tf auto-generates "rule-01", "rule-02", etc.
      id = optional(string)

      # true → rule is active; false → rule is defined but paused.
      enabled = optional(bool, true)

      # Only apply this rule to objects whose key starts with this string.
      # Example: "uploads/" means only objects inside that prefix.
      # Null means the rule applies to everything in the bucket.
      prefix = optional(string)

      # Only apply this rule to objects that have ALL of these tags.
      # When tags are set and a prefix is also needed, both are combined
      # via the "and" filter block in lifecycle.tf.
      tags = optional(map(string), {})

      # Delete the current version of an object after this many days.
      # Only creates the expiration block when non-null.
      expiration_days = optional(number)

      # Delete non-current (older) versions after this many days.
      # Applies when versioning is enabled and there are older versions.
      noncurrent_version_expiration_days = optional(number)

      # Cancel incomplete multipart uploads after this many days.
      # Incomplete uploads consume storage and incur charges even though
      # the object was never fully written.  Setting this to 7 days is
      # a good default for most workloads.
      abort_incomplete_multipart_upload_days = optional(number)

      # Move the current version of objects to a cheaper storage class
      # after the given number of days instead of deleting them.
      # Useful for data that is rarely accessed but must be kept.
      transitions = optional(list(object({
        days          = number # Days since the object was last modified
        storage_class = string # Target class: STANDARD_IA, GLACIER, etc.
      })), [])

      # Same as transitions but for non-current (older) versions.
      noncurrent_version_transitions = optional(list(object({
        noncurrent_days = number # Days since the version became non-current
        storage_class   = string # Target storage class
      })), [])
    })), [])

    # Server-side encryption settings for this bucket.
    # Every bucket is encrypted.  The only question is which key type.
    encryption = optional(object({
      # AES256  — AWS-managed key (free, no setup required, good default).
      # aws:kms — Customer-managed KMS key.  More control but adds cost and
      #           requires the kms_master_key_id field to be set.
      sse_algorithm = optional(string, "AES256")

      # ARN of the KMS key to use.  Only required when sse_algorithm = "aws:kms".
      # Example: "arn:aws:kms:us-east-1:123456789012:key/..."
      kms_master_key_id = optional(string)

      # Bucket Key reduces the number of calls made to KMS when using
      # aws:kms, which lowers cost.  Set true (default) to enable it.
      # Only meaningful when sse_algorithm = "aws:kms".
      bucket_key_enabled = optional(bool, true)
    }), {})

    # Controls AWS's S3 Block Public Access feature.
    # All four settings default to true, meaning the bucket is completely
    # private.  Only change these if you intentionally need public access
    # (e.g. a bucket that hosts public static files via CloudFront's OAC
    # does NOT need public access — OAC uses the AWS service principal).
    public_access_block = optional(object({
      # Prevent public ACLs from being set on the bucket or its objects.
      block_public_acls = optional(bool, true)
      # Prevent bucket policies that grant public access from taking effect.
      block_public_policy = optional(bool, true)
      # Ignore any existing public ACLs on the bucket or its objects.
      ignore_public_acls = optional(bool, true)
      # Block all access that would be granted to the public by any policy.
      restrict_public_buckets = optional(bool, true)
    }), {})

    # When true (the default), a bucket policy is attached that denies any
    # HTTP (non-HTTPS) request to the bucket.  This forces all traffic to
    # be encrypted in transit.  Should only be set to false if you have a
    # specific reason to allow plain-text S3 API calls.
    attach_tls_only_policy = optional(bool, true)

    # Extra bucket policy JSON strings to merge with the TLS-only policy.
    # Each string must be valid JSON representing an IAM policy document.
    # Use this to add CloudFront OAC statements or cross-account access
    # without having to disable the TLS enforcement.
    policy_documents = optional(list(string), [])

    # Simple per-bucket IAM policy toggle.  Kept for backward compatibility.
    # If you want full control, use the iam_policy block below instead.
    create_iam_policy = optional(bool)

    # Simple per-bucket IAM policy name override.  Kept for backward
    # compatibility.  Use iam_policy.name for new configurations.
    iam_policy_name = optional(string)

    # Full IAM policy configuration for this bucket.
    # When iam_policy.create is true, Terraform creates an IAM policy that
    # grants read/write access to the bucket.  Attach this policy to IAM
    # roles or users that need to interact with the bucket.
    iam_policy = optional(object({
      # Overrides create_iam_policy.  Precedence (highest first):
      #   1. iam_policy.create
      #   2. create_iam_policy (the flat field above)
      #   3. var.create_iam_policies (the module-level variable)
      create = optional(bool)

      # Custom name for the IAM policy.  If not set, locals.tf generates a
      # name from the bucket name plus a short hash suffix.
      name = optional(string)

      # S3 actions that apply at the *bucket* level (not object level).
      # ListBucket lets the caller see what objects exist.
      # GetBucketLocation is required by many SDKs before they list objects.
      # ListBucketMultipartUploads allows listing in-progress uploads.
      bucket_actions = optional(list(string), ["s3:ListBucket", "s3:GetBucketLocation", "s3:ListBucketMultipartUploads"])

      # S3 actions that apply at the *object* level (the resource is bucket/*)
      # GetObject — read an object
      # PutObject — upload or overwrite an object
      # DeleteObject — remove an object
      # AbortMultipartUpload — cancel an in-progress multipart upload
      object_actions = optional(list(string), ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:AbortMultipartUpload"])
    }), {})

    # Per-bucket tags that are merged on top of the module-level var.tags.
    # If the same tag key exists in both, the per-bucket value wins.
    # Example: { DataClass = "confidential", Service = "payments" }
    tags = optional(map(string), {})
  }))

  # When no buckets argument is passed, the module creates nothing.
  default = {}

  # -------------------------------------------------------------------------
  # Validation blocks
  # -------------------------------------------------------------------------
  # Terraform checks every validation block BEFORE calling any AWS API.
  # If a condition evaluates to false, Terraform prints the error_message and
  # stops.  This catches mistakes early and prevents partial deployments.

  # Validation 1 — S3 bucket naming rules
  # S3 bucket names are globally unique and must follow strict naming rules:
  #   • 3 to 63 characters long
  #   • Only lowercase letters, numbers, dots, and hyphens
  #   • Must start and end with a letter or number
  #   • No consecutive dots (".." is invalid)
  #   • Cannot look like an IP address ("1.2.3.4" would collide with path-style URLs)
  # coalesce() picks the first non-null value: bucket_name if set, otherwise the key.
  # can(regex(...)) returns true if the regex matches, false if it does not.
  validation {
    condition = alltrue([
      for bucket_key, bucket in var.buckets : (
        can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", coalesce(try(bucket.bucket_name, null), bucket_key))) &&
        length(regexall("\\.\\.", coalesce(try(bucket.bucket_name, null), bucket_key))) == 0 &&
        length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", coalesce(try(bucket.bucket_name, null), bucket_key))) == 0
      )
    ])

    error_message = "Each bucket key or bucket_name must be a valid S3 bucket name: 3-63 characters, lowercase letters, numbers, dots, and hyphens only, no consecutive dots, and not an IP address."
  }

  # Validation 2 — uniqueness check
  # Two entries that resolve to the same real bucket name would cause an AWS
  # conflict error deep in the apply.  This catches the mistake upfront.
  # distinct() removes duplicates; if the length drops, there was a collision.
  validation {
    condition = length(distinct([
      for bucket_key, bucket in var.buckets :
      coalesce(try(bucket.bucket_name, null), bucket_key)
    ])) == length(var.buckets)

    error_message = "Each bucket definition must resolve to a unique bucket name."
  }

  # Validation 3 — ownership mode allow-list
  # Only the three modes supported by the AWS provider for this resource are
  # allowed.  Any typo is caught here rather than producing a confusing AWS
  # API error.
  validation {
    condition = alltrue([
      for bucket in values(var.buckets) :
      contains(
        ["BucketOwnerEnforced", "BucketOwnerPreferred", "ObjectWriter"],
        try(bucket.ownership, "BucketOwnerEnforced")
      )
    ])

    error_message = "ownership must be BucketOwnerEnforced, BucketOwnerPreferred, or ObjectWriter."
  }

  # Validation 4 — lifecycle_days range check
  # A negative number makes no sense for a day count.  0 or null means
  # "no expiration rule" and is accepted.
  validation {
    condition = alltrue([
      for bucket in values(var.buckets) :
      try(bucket.lifecycle_days, null) == null || try(bucket.lifecycle_days, null) >= 0
    ])

    error_message = "lifecycle_days must be 0 or greater."
  }

  # Validation 5 — each lifecycle rule must do something
  # An empty rule (no expiration, no transition) would be accepted by
  # Terraform's type system but rejected by the AWS API.  This check fires
  # the friendly error before that happens.
  # anytrue() returns true if at least one element in the list is true.
  # flatten() collapses nested lists so alltrue() can process a flat list.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for rule in try(bucket.lifecycle_rules, []) : anytrue([
          try(rule.expiration_days, null) != null,
          try(rule.noncurrent_version_expiration_days, null) != null,
          try(rule.abort_incomplete_multipart_upload_days, null) != null,
          length(try(rule.transitions, [])) > 0,
          length(try(rule.noncurrent_version_transitions, [])) > 0
        ])
      ]
    ]))

    error_message = "Each lifecycle rule must define at least one expiration or transition action."
  }

  # Validation 6 — lifecycle day values must be positive
  # 0 days would mean "expire immediately", which is never intentional.
  # The null check is important: null means the field was not set and is fine.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for rule in try(bucket.lifecycle_rules, []) : (
          (try(rule.expiration_days, null) == null || try(rule.expiration_days, null) > 0) &&
          (try(rule.noncurrent_version_expiration_days, null) == null || try(rule.noncurrent_version_expiration_days, null) > 0) &&
          (try(rule.abort_incomplete_multipart_upload_days, null) == null || try(rule.abort_incomplete_multipart_upload_days, null) > 0)
        )
      ]
    ]))

    error_message = "Lifecycle day values must be greater than 0 when provided."
  }

  # Validation 7 — transition storage class allow-list (current versions)
  # The AWS S3 API only accepts specific class names.  A typo in storage_class
  # produces a vague AWS API error.  This gives a clear message early.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for rule in try(bucket.lifecycle_rules, []) : alltrue([
          for transition in try(rule.transitions, []) :
          transition.days > 0 && contains(["STANDARD_IA", "ONEZONE_IA", "INTELLIGENT_TIERING", "GLACIER_IR", "GLACIER", "DEEP_ARCHIVE"], transition.storage_class)
        ])
      ]
    ]))

    error_message = "Lifecycle transitions must use a supported storage class and a day value greater than 0."
  }

  # Validation 8 — transition storage class allow-list (non-current versions)
  # Same check as above but for transitions on older object versions.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for rule in try(bucket.lifecycle_rules, []) : alltrue([
          for transition in try(rule.noncurrent_version_transitions, []) :
          transition.noncurrent_days > 0 && contains(["STANDARD_IA", "ONEZONE_IA", "INTELLIGENT_TIERING", "GLACIER_IR", "GLACIER", "DEEP_ARCHIVE"], transition.storage_class)
        ])
      ]
    ]))

    error_message = "Noncurrent lifecycle transitions must use a supported storage class and a day value greater than 0."
  }

  # Validation 9 — encryption algorithm allow-list
  # The AWS SSE API only accepts "AES256" or "aws:kms".  Any other string is
  # rejected.  Blocking it here gives a clearer error than the AWS response.
  validation {
    condition = alltrue([
      for bucket in values(var.buckets) :
      contains(["AES256", "aws:kms"], try(bucket.encryption.sse_algorithm, "AES256"))
    ])

    error_message = "encryption.sse_algorithm must be AES256 or aws:kms."
  }

  # Validation 10 — KMS key required when using aws:kms
  # Without a key ARN, the resource would fail during the apply with a
  # cryptic AWS error.  This surfaces the issue at plan time.
  validation {
    condition = alltrue([
      for bucket in values(var.buckets) :
      try(bucket.encryption.sse_algorithm, "AES256") != "aws:kms" || try(bucket.encryption.kms_master_key_id, null) != null
    ])

    error_message = "encryption.kms_master_key_id must be set when encryption.sse_algorithm is aws:kms."
  }

  # Validation 11 — IAM policy name format
  # IAM policy names must match the pattern the IAM service accepts.
  # compact() removes null/empty values so we only validate names that are
  # actually set.  can(regex()) is true when the regex matches the string.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for policy_name in compact([
          try(bucket.iam_policy_name, null),
          try(bucket.iam_policy.name, null)
        ]) : can(regex("^[\\w+=,.@-]{1,128}$", policy_name))
      ]
    ]))

    error_message = "IAM policy names must be 1-128 characters and may contain alphanumeric characters plus +=,.@-_."
  }

  # Validation 12 — IAM policy name uniqueness
  # Two buckets that generate the same policy name would conflict in IAM.
  # distinct() collapses duplicates; if the length drops, names are not unique.
  validation {
    condition = length(distinct(flatten([
      for bucket in values(var.buckets) : compact([
        try(bucket.iam_policy_name, null),
        try(bucket.iam_policy.name, null)
      ])
      ]))) == length(flatten([
      for bucket in values(var.buckets) : compact([
        try(bucket.iam_policy_name, null),
        try(bucket.iam_policy.name, null)
      ])
    ]))

    error_message = "Custom IAM policy names must be unique across all bucket definitions."
  }

  # Validation 13 — policy_documents must be valid JSON
  # Each string in policy_documents is merged into the bucket policy.
  # An invalid JSON string would cause a confusing error during the apply.
  # can(jsondecode()) returns true if the string parses as valid JSON.
  validation {
    condition = alltrue(flatten([
      for bucket in values(var.buckets) : [
        for document in try(bucket.policy_documents, []) : can(jsondecode(document))
      ]
    ]))

    error_message = "Each policy_documents entry must be valid JSON."
  }
}

# ---------------------------------------------------------------------------
# variable "create_iam_policies"
# ---------------------------------------------------------------------------
# Module-level default for generating read/write IAM policies.
# Setting this to true creates a policy for every bucket in the module.
#
# Overriding per bucket:
#   buckets = {
#     data = {
#       iam_policy = { create = false }   # skip policy for this bucket only
#     }
#   }
#
# Precedence (highest first):
#   1. bucket.iam_policy.create  — per-bucket (nested)
#   2. bucket.create_iam_policy  — per-bucket (flat, for backward compatibility)
#   3. var.create_iam_policies   — this variable (module-level default)
variable "create_iam_policies" {
  description = "If true, create a read/write IAM policy for every bucket unless overridden at the bucket level."
  type        = bool
  default     = false
}

# ---------------------------------------------------------------------------
# variable "tags"
# ---------------------------------------------------------------------------
# Base tags applied to every resource created by the module.
# Common keys: Project, Environment, ManagedBy, CostCenter.
#
# How merging works:
#   Each resource receives: merge(var.tags, bucket.tags)
# If a tag key exists in both, the per-bucket tag value wins.
#
# Example:
#   tags = {
#     Project     = "kjl"
#     Environment = "prod"
#     ManagedBy   = "Terraform"
#   }
variable "tags" {
  description = "Base tags applied to all resources. Bucket-level tags are merged on top."
  type        = map(string)
  default     = {}
}
