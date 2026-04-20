# -----------------------------------------------------------------------------
# S3 BUCKETS
# -----------------------------------------------------------------------------
variable "buckets" {
  description = "Combined S3 bucket configuration for frontend hosting and CloudFront access logging."
  type = object({
    frontend = object({
      bucket_name = string
      lifecycle_rules = optional(list(object({
        id      = string
        enabled = bool
        prefix  = optional(string)
        expiration = object({
          days = optional(number)
        })
      })), [])
    })
    logs = object({
      enabled    = optional(bool, true)
      log_prefix = string
      bucket_name = string
      lifecycle_rules = optional(list(object({
        id      = string
        enabled = bool
        prefix  = optional(string)
        expiration = object({
          days = optional(number)
        })
      })), [])
    })
  })

  validation {
    condition = try(var.buckets.frontend.bucket_name, null) == null || (
      can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.buckets.frontend.bucket_name)) &&
      length(regexall("\\.\\.", var.buckets.frontend.bucket_name)) == 0 &&
      length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", var.buckets.frontend.bucket_name)) == 0
    )
    error_message = "buckets.frontend.bucket_name must be a valid S3 bucket name when provided."
  }

  validation {
    condition     = try(var.buckets.logs.log_prefix, "cloudfront/") == "" || !startswith(try(var.buckets.logs.log_prefix, "cloudfront/"), "/")
    error_message = "buckets.logs.log_prefix must be empty or must not start with '/'."
  }

  validation {
    condition = try(var.buckets.logs.bucket_name, null) == null || (
      can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.buckets.logs.bucket_name)) &&
      length(regexall("\\.\\.", var.buckets.logs.bucket_name)) == 0 &&
      length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", var.buckets.logs.bucket_name)) == 0
    )
    error_message = "buckets.logs.bucket_name must be a valid S3 bucket name when provided."
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
    domain_name             = string
    subject_alternative_names = optional(list(string), [])
    zone_id                 = string
    create_route53_records  = optional(bool, true)
    validation_zone_ids     = optional(map(string), {})
    validation_record_fqdns = optional(list(string), [])
  })

  validation {
    condition     = !try(var.acm.create_route53_records, true) || var.acm.zone_id != null
    error_message = "zone_id must be set when acm.create_route53_records is true."
  }
}

# -----------------------------------------------------------------------------
# CLOUDFRONT
# -----------------------------------------------------------------------------
variable "cloudfront" {
  description = "CloudFront distribution settings exposed by the hosting wrapper."
  type = object({
    project_name = string
    environment  = string
    aliases = list(string)
    continuous_deployment_policy_id = optional(string, null)
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
    price_class = optional(string, "PriceClass_100")
    default_root_object = optional(string, "index.html")
    web_acl_id = optional(string)
    # Additional CloudFront settings can be added here as needed.
  })
}

variable "tags" {
  description = "Additional tags merged on top of the module's default Project, Environment, ManagedBy, and Module tags."
  type        = map(string)
  default     = {}
}