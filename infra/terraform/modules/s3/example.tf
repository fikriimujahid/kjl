/*
Example usage for a production-style, multi-bucket S3 deployment.

module "shared_storage" {
  source = "./modules/s3"

  tags = {
    Project     = "shared-platform"
    Environment = "prod"
    ManagedBy   = "Terraform"
    CostCenter  = "platform"
  }

  # Enable IAM policy creation by default for buckets that do not override it.
  create_iam_policies = false

  buckets = {
    # Application content bucket encrypted with a customer-managed KMS key.
    content = {
      bucket_name   = "shared-platform-prod-content"
      force_destroy = false
      ownership     = "BucketOwnerEnforced"

      versioning = {
        enabled = true
      }

      encryption = {
        sse_algorithm      = "aws:kms"
        kms_master_key_id  = "arn:aws:kms:ap-southeast-1:123456789012:key/11111111-2222-3333-4444-555555555555"
        bucket_key_enabled = true
      }

      lifecycle_rules = [
        {
          id              = "content-tiering"
          enabled         = true
          prefix          = "uploads/"
          expiration_days = 365
          transitions = [
            {
              days          = 30
              storage_class = "STANDARD_IA"
            },
            {
              days          = 180
              storage_class = "DEEP_ARCHIVE"
            }
          ]
        }
      ]

      iam_policy = {
        create = true
        name   = "shared-platform-prod-content-rw"
      }

      tags = {
        DataClass = "internal"
        Service   = "content"
      }
    }

    # Log/archive bucket using the legacy lifecycle_days input for compatibility.
    logs = {
      bucket_name        = "shared-platform-prod-access-logs"
      versioning_enabled = true
      force_destroy      = false
      ownership          = "BucketOwnerPreferred"
      lifecycle_days     = 180

      tags = {
        DataClass = "audit"
        Service   = "logging"
      }
    }
  }
}
*/