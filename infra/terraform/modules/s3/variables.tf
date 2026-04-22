# ---------------------------------------------------------------------------
# variables.tf
#
# Public inputs for the single-bucket S3 module.
# ---------------------------------------------------------------------------
variable "bucket_name" {
  description = "S3 bucket name. Must be globally unique across all AWS accounts and regions."
  type        = string
}

variable "force_destroy" {
  description = "Whether to allow Terraform to delete non-empty buckets.  Use with caution in production."
  type        = bool
}

variable "tags" {
  description = "Base tags applied to all resources. Bucket-level tags are merged on top."
  type        = map(string)
  default     = {}
}

variable "versioning_enabled" {
  description = "Whether to enable versioning on the bucket."
  type        = bool
}

variable "encryption" {
  description = "Server-side encryption configuration for the bucket.  If null or empty, defaults to AES256 with no KMS key."
  type = object({
    sse_algorithm      = optional(string, "AES256")
    kms_master_key_id  = optional(string)
    bucket_key_enabled = optional(bool, true)
  })
}

variable "lifecycle_config" {
  description = "Lifecycle configuration for the bucket.  If lifecycle_rules is empty, no lifecycle configuration will be applied."
  type = object({

    lifecycle_days = optional(number)
    lifecycle_rules = optional(list(object({
      id      = optional(string)
      enabled = optional(bool, true)
      prefix  = optional(string)
      tags    = optional(map(string), {})

      expiration_days                        = optional(number)
      noncurrent_version_expiration_days     = optional(number)
      abort_incomplete_multipart_upload_days = optional(number)

      transitions = optional(list(object({
        days          = number
        storage_class = string
      })), [])

      noncurrent_version_transitions = optional(list(object({
        noncurrent_days = number
        storage_class   = string
      })), [])
    })), [])
  })
}

variable "security" {
  description = "Security configuration for the bucket, including public access block and TLS-only policy attachment."
  type = object({
    public_access_block = optional(object({
      block_public_acls       = optional(bool, true)
      block_public_policy     = optional(bool, true)
      ignore_public_acls      = optional(bool, true)
      restrict_public_buckets = optional(bool, true)
    }), {})
    object_ownership            = optional(string, "BucketOwnerEnforced")
    attach_tls_only_policy      = optional(bool, true)
    additional_policy_documents = optional(list(string), [])
  })
}