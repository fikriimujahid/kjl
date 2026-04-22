# ---------------------------------------------------------------------------
# security.tf
#
# This file handles three security layers:
#   1. Public access blocking  — prevents buckets from being made public
#   2. Ownership controls      — defines who owns objects in the bucket
#   3. Bucket policies         — attaches least-privilege IAM statements,
#                                including a mandatory TLS-only rule
#
# Order matters: the bucket policy (resource 3) depends on resources 1 and 2
# being in place first.  That is enforced via depends_on at the bottom.
# ---------------------------------------------------------------------------


# ---------------------------------------------------------------------------
# Public access block
# ---------------------------------------------------------------------------
# S3's Block Public Access feature is a hard boundary designed to prevent
# buckets from ever becoming internet-accessible, even if a misconfigured
# bucket policy or ACL accidentally grants public access.
#
# By default all four settings are true (fully private).  A caller can
# relax specific settings via the public_access_block block in their
# var.buckets entry, but this module defaults to maximum privacy.
resource "aws_s3_bucket_public_access_block" "this" {
  bucket = aws_s3_bucket.this.id

  # Prevent new public ACLs from being set on the bucket or any object.
  block_public_acls = var.security.public_access_block.block_public_acls

  # Prevent a bucket policy that grants anonymous (public) access from
  # taking effect, even if someone writes such a policy.
  block_public_policy = var.security.public_access_block.block_public_policy

  # Ignore existing public ACLs.  Past mistakes in ACLs will not grant access.
  ignore_public_acls = var.security.public_access_block.ignore_public_acls

  # Block all access that would be granted to the public by any current or
  # future bucket policy or ACL.
  restrict_public_buckets = var.security.public_access_block.restrict_public_buckets
}


# ---------------------------------------------------------------------------
# Ownership controls
# ---------------------------------------------------------------------------
# Controls who owns objects written to the bucket and whether ACLs are
# enabled.  AWS recommends BucketOwnerEnforced (the default in this module)
# for new buckets because it:
#   • Disables ACLs entirely (modern, recommended approach)
#   • Ensures the bucket owner has full control over all objects, even those
#     uploaded by other AWS accounts or services (e.g. S3 access logs)
#
# Exception: S3 access-log delivery requires BucketOwnerPreferred because
# the Amazon logging service keeps object ownership via ACLs.
resource "aws_s3_bucket_ownership_controls" "this" {
  bucket = aws_s3_bucket.this.id

  rule {
    # object_ownership was resolved in locals.tf from the caller's "ownership"
    # field: BucketOwnerEnforced | BucketOwnerPreferred | ObjectWriter
    object_ownership = var.security.object_ownership
  }
}


# ---------------------------------------------------------------------------
# TLS-only policy document (data source)
# ---------------------------------------------------------------------------
# A "data source" reads information without creating or modifying anything.
# This data source generates the JSON for a bucket policy statement that
# denies all S3 requests made over plain HTTP (non-HTTPS/TLS).
#
# Why deny HTTP?
#   Data in transit must be encrypted.  Without this rule an attacker on the
#   network path could read or tamper with S3 API requests.
#
# Scope:
#   Only created for buckets where attach_tls_only_policy == true AND that
#   are already in buckets_with_policy.  The inline for_each filter avoids
#   creating documents for buckets that do not need them.
data "aws_iam_policy_document" "tls_only" {
  count = var.security.attach_tls_only_policy ? 1 : 0

  statement {
    # sid is an optional identifier for the statement shown in the AWS console.
    sid = "DenyInsecureTransport"

    # "Deny" means: if the condition is met, ACCESS IS BLOCKED, regardless of
    # any Allow statements elsewhere.  Deny always wins over Allow in IAM.
    effect = "Deny"

    # Block ALL S3 actions when the request uses HTTP (not HTTPS).
    actions = ["s3:*"]

    # Apply the deny to the bucket itself AND to every object inside it (/*)
    resources = [
      aws_s3_bucket.this.arn,
      "${aws_s3_bucket.this.arn}/*"
    ]

    # Apply to everyone (any IAM principal, any AWS service, any anonymous user).
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    # The condition that triggers the Deny:
    #   aws:SecureTransport = "false"  means the request was NOT using HTTPS.
    # If the request IS using HTTPS, aws:SecureTransport is "true" and
    # this condition does NOT match, so the Deny does not fire.
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}


# ---------------------------------------------------------------------------
# Merged bucket policy document (data source)
# ---------------------------------------------------------------------------
# This data source merges multiple partial policy documents into one final
# JSON policy that can be attached to the bucket.
#
# source_policy_documents accepts a list of JSON strings.  The provider reads
# all of them and combines their statements into a single policy document.
# This approach is called "policy composition" — each concern (TLS, OAC, etc.)
# stays in its own document and they are joined here.
#
# Only buckets in buckets_with_policy get this resource.
data "aws_iam_policy_document" "bucket_policy" {
  count = length(concat(
    var.security.attach_tls_only_policy ? [data.aws_iam_policy_document.tls_only[0].json] : [],
    var.security.additional_policy_documents
  )) > 0 ? 1 : 0

  source_policy_documents = concat(
    var.security.attach_tls_only_policy ? [data.aws_iam_policy_document.tls_only[0].json] : [],
    var.security.additional_policy_documents
  )
}


# ---------------------------------------------------------------------------
# Bucket policy attachment
# ---------------------------------------------------------------------------
# Attaches the merged policy JSON to the bucket.  Without this resource
# the policy documents above are computed but never applied.
#
# depends_on is REQUIRED here:
#   AWS rejects the bucket policy if Block Public Access settings or ownership
#   controls are not yet applied.  Terraform cannot infer this dependency from
#   the code because the policy resource only references aws_s3_bucket.this,
#   not the other two resources.  depends_on makes it explicit.
resource "aws_s3_bucket_policy" "tls_only" {
  count = length(data.aws_iam_policy_document.bucket_policy) > 0 ? 1 : 0

  bucket = aws_s3_bucket.this.id

  # The final merged policy JSON from the data source above.
  policy = data.aws_iam_policy_document.bucket_policy[0].json

  depends_on = [
    aws_s3_bucket_public_access_block.this,
    aws_s3_bucket_ownership_controls.this
  ]
}
