# aws_s3_bucket.this
# ------------------
# This is the central resource of the module.  Every other resource in every
# other file in this module depends on the buckets created here.
#
# "this" is a conventional Terraform name for the primary resource when a
# module manages only one type of resource.  Do not read it as "a single
# bucket" — for_each means it can represent many buckets.
resource "aws_s3_bucket" "this" {
  bucket        = var.bucket_name
  force_destroy = var.force_destroy
  tags          = var.tags
}
