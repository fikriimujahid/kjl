# -----------------------------------------------------------------------------
# S3 STATIC HOSTING BUCKETS
# -----------------------------------------------------------------------------
variable "s3_static_hosting" {
  description = "S3 bucket configuration for static website hosting."
  type = object({
    bucket_name = string
  })

  validation {
    condition = try(var.s3_static_hosting.bucket_name, null) == null || (
      can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.s3_static_hosting.bucket_name)) &&
      length(regexall("\\.\\.", var.s3_static_hosting.bucket_name)) == 0 &&
      length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", var.s3_static_hosting.bucket_name)) == 0
    )
    error_message = "s3_static_hosting.bucket_name must be a valid S3 bucket name when provided."
  }
}

# -----------------------------------------------------------------------------
# S3 CLOUDFRONT LOG
# -----------------------------------------------------------------------------
variable "s3_cloudfront_log" {
  description = "S3 bucket configuration for CloudFront access logging."
  type = object({
    bucket_name    = string
    lifecycle_days = optional(number)
    lifecycle_rules = optional(list(object({
      id      = string
      enabled = bool
      prefix  = optional(string)
      expiration = object({
        days = optional(number)
      })
    })), [])
  })

  validation {
    condition = try(var.s3_cloudfront_log.bucket_name, null) == null || (
      can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.s3_cloudfront_log.bucket_name)) &&
      length(regexall("\\.\\.", var.s3_cloudfront_log.bucket_name)) == 0 &&
      length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", var.s3_cloudfront_log.bucket_name)) == 0
    )
    error_message = "s3_cloudfront_log.bucket_name must be a valid S3 bucket name when provided."
  }
}

# -----------------------------------------------------------------------------
# ACM CERTIFICATE
# -----------------------------------------------------------------------------
# ACM (AWS Certificate Manager) certificate issuance and validation settings.
# All fields are optional — the defaults work correctly in most cases.
variable "acm" {
  description = "ACM certificate settings exposed by the hosting wrapper."
  type = object({
    domain_name               = optional(string, null)
    subject_alternative_names = optional(list(string), [])
    zone_id                   = optional(string, null)
    existing_certificate_arn  = optional(string, null)
    validation_zone_ids       = optional(map(string), {})
    validation_record_fqdns   = optional(list(string), [])
  })

  validation {
    condition     = try(var.acm.existing_certificate_arn, null) != null || try(var.acm.domain_name, null) != null
    error_message = "acm.domain_name is required when acm.existing_certificate_arn is not provided."
  }

  validation {
    condition     = try(var.acm.existing_certificate_arn, null) != null || try(var.acm.zone_id, null) != null
    error_message = "acm.zone_id is required when acm.existing_certificate_arn is not provided."
  }
}

# -----------------------------------------------------------------------------
# CLOUDFRONT
# -----------------------------------------------------------------------------
variable "cloudfront" {
  description = "CloudFront distribution settings exposed by the hosting wrapper."
  type = object({
    project_name                    = string
    environment                     = string
    aliases                         = list(string)
    zone_id                         = string
    continuous_deployment_policy_id = optional(string, null)
    public_origin = optional(object({
      enabled                     = optional(bool, false)
      bucket_name                 = optional(string)
      bucket_regional_domain_name = optional(string)
      manage_bucket_policy        = optional(bool, true)
    }), {})
    api_origin = optional(object({
      enabled                  = optional(bool, false)
      domain_name              = optional(string)
      path_pattern             = optional(string, "/api/*")
      origin_path              = optional(string)
      connection_attempts      = optional(number, 3)
      connection_timeout       = optional(number, 10)
      origin_protocol_policy   = optional(string, "https-only")
      origin_ssl_protocols     = optional(list(string), ["TLSv1.2"])
      origin_keepalive_timeout = optional(number, 5)
      origin_read_timeout      = optional(number, 30)
    }), {})
    ordered_cache_behaviors = optional(list(object({
      path_pattern               = string
      target_origin_id           = string
      viewer_protocol_policy     = optional(string, "redirect-to-https")
      allowed_methods            = optional(list(string), ["GET", "HEAD", "OPTIONS"])
      cached_methods             = optional(list(string), ["GET", "HEAD", "OPTIONS"])
      compress                   = optional(bool, true)
      cache_policy_id            = optional(string, "658327ea-f89d-4fab-a63d-7e88639e58f6")
      origin_request_policy_id   = optional(string)
      response_headers_policy_id = optional(string)
    })), [])
    custom_error_responses = optional(list(object({
      error_code            = number
      response_code         = optional(number)
      response_page_path    = optional(string)
      error_caching_min_ttl = optional(number, 0)
    })), [])
    geo_restriction = optional(object({
      restriction_type = optional(string, "none")
      locations        = optional(list(string), [])
    }), {})
    rewrite_config = optional(object({
      default_index_file           = optional(string, "index.html")
      enable_trailing_slash_index = optional(bool, true)
      enable_extensionless_index  = optional(bool, true)
      extension_index_rules = optional(list(object({
        extension  = string
        index_file = optional(string, "index.html")
      })), [])
      ignored_prefixes    = optional(list(string), ["/_next/", "/api/", "/public-data/"])
      ignored_contains    = optional(list(string), ["/__next."])
      ignored_exact_paths = optional(list(string), [])
    }), {})
    price_class         = optional(string, "PriceClass_100")
    default_root_object = optional(string, "index.html")
    web_acl_id          = optional(string)
    # Additional CloudFront settings can be added here as needed.
  })

  validation {
    condition = !try(var.cloudfront.public_origin.enabled, false) || (
      try(var.cloudfront.public_origin.bucket_name, null) != null &&
      try(var.cloudfront.public_origin.bucket_regional_domain_name, null) != null
    )
    error_message = "When cloudfront.public_origin.enabled is true, cloudfront.public_origin.bucket_name and cloudfront.public_origin.bucket_regional_domain_name are required."
  }

  validation {
    condition = !try(var.cloudfront.api_origin.enabled, false) || (
      try(var.cloudfront.api_origin.domain_name, null) != null &&
      trimspace(try(var.cloudfront.api_origin.domain_name, "")) != ""
    )
    error_message = "When cloudfront.api_origin.enabled is true, cloudfront.api_origin.domain_name is required."
  }

  validation {
    condition = alltrue([
      for rule in try(var.cloudfront.rewrite_config.extension_index_rules, []) :
      can(regex("^\\.[A-Za-z0-9._-]+$", rule.extension)) &&
      can(regex("^[^/]+$", try(rule.index_file, "index.html")))
    ])
    error_message = "cloudfront.rewrite_config.extension_index_rules must use extension values like '.txt' and index_file values without '/'."
  }
}

variable "tags" {
  description = "Additional tags merged on top of the module's default Project, Environment, ManagedBy, and Module tags."
  type        = map(string)
  default     = {}
}