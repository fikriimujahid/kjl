# ---------------------------------------------------------------------------
# iam.tf
#
# Creates a per-bucket IAM managed policy that grants read/write access to
# the bucket.  These policies are standalone — they must be *attached* to an
# IAM role, user, or group to take effect.  The module creates and manages
# the policies; attaching them is the caller's responsibility.
#
# Why per-bucket policies?
#   Least-privilege principle: each workload should only access the buckets
#   it needs.  A single policy that grants access to all buckets would give
#   every role too much access.
#
# Only buckets with iam_policy.create = true (resolved in locals.tf) get
# a policy.  The filter is applied by using buckets_with_iam_policy as the
# for_each source.
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# IAM policy document (data source)
# ---------------------------------------------------------------------------
# Generates the JSON for a read/write policy BEFORE the actual managed policy
# resource is created.  This is the same pattern used in security.tf:
# compute the document first, attach it second.
data "aws_iam_policy_document" "bucket_rw" {
  # Only for buckets that need an IAM policy.
  for_each = local.buckets_with_iam_policy

  # Statement 1: bucket-level actions
  # ----------------------------------
  # These actions operate on the bucket object itself (no trailing /*)
  # Examples: s3:ListBucket, s3:GetBucketLocation
  # Without these, an application that tries to list objects gets:
  #   "Access Denied" before it can even start reading.
  statement {
    # sid is a human-readable label.  It appears in CloudTrail logs and
    # the IAM policy editor making troubleshooting easier.
    sid    = "BucketLevelAccess"
    effect = "Allow"

    # The list of actions comes from normalized iam_policy.bucket_actions.
    # Defaults are defined in locals.tf (default_bucket_actions).
    actions = each.value.iam_policy.bucket_actions

    # The resource is JUST the bucket ARN (no wildcard).
    # arn:aws:s3:::my-bucket (not arn:aws:s3:::my-bucket/*)
    resources = [aws_s3_bucket.this[each.key].arn]
  }

  # Statement 2: object-level actions
  # -----------------------------------
  # These actions operate on individual objects inside the bucket.
  # The resource must include the /* wildcard to match all objects.
  # Examples: s3:GetObject, s3:PutObject, s3:DeleteObject
  statement {
    sid    = "ObjectLevelAccess"
    effect = "Allow"

    actions = each.value.iam_policy.object_actions

    # arn:aws:s3:::my-bucket/*  — matches every object in the bucket.
    # Note: if you leave off the /*, GetObject and PutObject will be Denied.
    resources = ["${aws_s3_bucket.this[each.key].arn}/*"]
  }
}


# ---------------------------------------------------------------------------
# IAM managed policy resource
# ---------------------------------------------------------------------------
# Turns the JSON document above into an actual AWS IAM Managed Policy that
# can be found in the IAM console and attached to roles.
resource "aws_iam_policy" "bucket_rw" {
  for_each = local.buckets_with_iam_policy

  # Policy name resolved by locals.tf (auto-generated or caller-supplied).
  name = each.value.iam_policy.name

  # A human-readable description shown in the IAM console.
  description = "Read/write access policy for S3 bucket ${each.value.bucket_name}."

  # The actual JSON policy content from the data source above.
  policy = data.aws_iam_policy_document.bucket_rw[each.key].json

  # Inherit the per-bucket tags so cost allocation reports can identify
  # which application this policy belongs to.
  tags = each.value.tags
}
