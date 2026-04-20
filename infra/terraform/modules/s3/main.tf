# ---------------------------------------------------------------------------
# main.tf
#
# This file creates the core S3 bucket resource(s).
# It is intentionally small — all other configuration (encryption, versioning,
# policies, lifecycle) lives in separate files so each concern is easy to
# find and change independently.
# ---------------------------------------------------------------------------

# aws_s3_bucket.this
# ------------------
# This is the central resource of the module.  Every other resource in every
# other file in this module depends on the buckets created here.
#
# "this" is a conventional Terraform name for the primary resource when a
# module manages only one type of resource.  Do not read it as "a single
# bucket" — for_each means it can represent many buckets.
resource "aws_s3_bucket" "this" {
  # -------------------------------------------------------------------------
  # for_each
  # -------------------------------------------------------------------------
  # for_each tells Terraform to run this resource block once for every entry
  # in the map.  Instead of creating one resource, Terraform creates N
  # resources, one per key.
  #
  # local.normalized_buckets is a map computed in locals.tf.  Each key is
  # the logical bucket identifier the caller used in var.buckets, and each
  # value is a uniform object with all optional fields resolved to concrete
  # values.
  #
  # Inside the block, two special variables become available:
  #   each.key   — the string key from the map (e.g. "content" or
  #                "my-project-prod-logs")
  #   each.value — the full normalized object for that bucket (bucket_name,
  #                force_destroy, tags, encryption settings, etc.)
  #
  # Why use for_each instead of count?
  #   count uses a number index (0, 1, 2 …).  If you remove the first bucket
  #   from a list, Terraform shifts every index and tries to destroy+recreate
  #   all remaining buckets.  for_each uses stable string keys, so removing
  #   one entry only destroys that one bucket.
  for_each = local.normalized_buckets

  # The actual bucket name that appears in the AWS console and in all AWS API
  # calls.  It comes from the normalized bucket object:
  #   • If the caller set bucket_name explicitly, that value is used.
  #   • Otherwise the map key (each.key) is used as the bucket name.
  # This separation lets callers use short logical names as map keys while
  # still controlling the full AWS bucket name independently.
  bucket = each.value.bucket_name

  # force_destroy controls what happens when Terraform tries to delete this
  # bucket.
  #
  # false (default, strongly recommended for production):
  #   Terraform will ERROR if the bucket is not empty.  You must manually
  #   empty the bucket before destroying it.  This prevents accidental data
  #   loss.
  #
  # true (useful only for dev/test environments):
  #   Terraform deletes all objects inside the bucket first, then removes the
  #   bucket.  This can cause permanent, unrecoverable data loss if used on
  #   a production bucket by mistake.
  force_destroy = each.value.force_destroy

  # tags are key-value pairs attached to the bucket in AWS.
  # They show up in the AWS Console, billing reports, and access policies.
  # each.value.tags is the per-bucket tag map computed in locals.tf by
  # merging the module-level var.tags with any per-bucket tags the caller
  # provided.  Per-bucket tags always win when keys collide.
  tags = each.value.tags
}
