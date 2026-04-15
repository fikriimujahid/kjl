resource "aws_s3_bucket" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = var.bucket_name
  tags   = var.tags
}

data "aws_s3_bucket" "existing" {
  count = var.create_bucket ? 0 : 1

  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = aws_s3_bucket.this[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = aws_s3_bucket.this[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = false
  }
}

resource "aws_s3_bucket_public_access_block" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = aws_s3_bucket.this[0].id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = aws_s3_bucket.this[0].id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "bucket_policy" {
  count = var.create_bucket ? 1 : 0

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    actions = ["s3:*"]

    resources = [
      aws_s3_bucket.this[0].arn,
      "${aws_s3_bucket.this[0].arn}/*"
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  count = var.create_bucket ? 1 : 0

  bucket = aws_s3_bucket.this[0].id
  policy = data.aws_iam_policy_document.bucket_policy[0].json
}
