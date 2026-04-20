# -----------------------------------------------------------------------------
# MODULE: s3
# -----------------------------------------------------------------------------
# Creates all S3 buckets required by this hosting stack.
# By default two buckets are created:
#   "frontend"  — stores the website's HTML, CSS, JS, and image files
#   "logs"      — stores CloudFront access log files
module "s3" {
  source = "../s3"

  buckets = {
    frontend = {
      bucket_name        = var.buckets.frontend.bucket_name
      force_destroy      = false
      ownership          = "BucketOwnerEnforced"
      versioning_enabled = false
      lifecycle_days     = 0
      lifecycle_rules = [
        for rule in try(var.buckets.frontend.lifecycle_rules, []) : {
          id              = rule.id
          enabled         = rule.enabled
          prefix          = try(rule.prefix, null)
          expiration_days = try(rule.expiration.days, null)
        }
      ]
      encryption = {
        sse_algorithm      = "AES256"
        kms_master_key_id  = null
        bucket_key_enabled = true
      }
      public_access_block = {
        block_public_acls       = true
        block_public_policy     = true
        ignore_public_acls      = true
        restrict_public_buckets = true
      }
      attach_tls_only_policy = false
      policy_documents       = []
    }

    logs = {
      bucket_name        = var.buckets.logs.bucket_name
      log_prefix         = var.buckets.logs.log_prefix
      force_destroy      = false
      ownership          = "BucketOwnerPreferred"
      versioning_enabled = true
      lifecycle_days     = 90
      lifecycle_rules = [
        for rule in try(var.buckets.logs.lifecycle_rules, []) : {
          id              = rule.id
          enabled         = rule.enabled
          prefix          = try(rule.prefix, null)
          expiration_days = try(rule.expiration.days, null)
        }
      ]
      encryption = {
        sse_algorithm      = "AES256"
        kms_master_key_id  = null
        bucket_key_enabled = true
      }
      public_access_block = {
        block_public_acls       = true
        block_public_policy     = true
        ignore_public_acls      = true
        restrict_public_buckets = true
      }
      attach_tls_only_policy = true
      policy_documents       = []
    }
  }
  tags = var.tags
}

# -----------------------------------------------------------------------------
# MODULE: acm
# -----------------------------------------------------------------------------
# Requests an AWS Certificate Manager (ACM) TLS certificate for your domain
# and waits for DNS validation to complete before continuing.
module "acm" {
  source = "../acm"

  domain_name = var.acm.domain_name
  subject_alternative_names = var.acm.subject_alternative_names
  zone_id = var.acm.zone_id
  validation_zone_ids = try(var.acm.validation_zone_ids, {})
  create_route53_records = try(var.acm.create_route53_records, true)
  validation_record_fqdns = try(var.acm.validation_record_fqdns, [])
  validation_record_ttl = 60
  wait_for_validation = true
  certificate_region = "us-east-1"
  key_algorithm = "RSA_2048"
  certificate_transparency_logging_enabled = true
  tags = var.tags
}

# -----------------------------------------------------------------------------
# MODULE: cloudfront
# -----------------------------------------------------------------------------
# Creates the Amazon CloudFront CDN distribution that serves your website.
module "cloudfront" {
  source = "../cloudfront"

  project_name = var.cloudfront.project_name
  environment  = var.cloudfront.environment
  distribution_name = "${var.cloudfront.project_name}-${var.cloudfront.environment}-web"
  comment = "${var.cloudfront.project_name}-${var.cloudfront.environment}-web"
  enabled = true
  is_ipv6_enabled = true
  wait_for_deployment = true
  retain_on_delete = false
  continuous_deployment_policy_id = try(var.cloudfront.continuous_deployment_policy_id, null)
  http_version = "http2and3"
  origins = {
    frontend = {
      domain_name = module.s3.buckets["frontend"].regional_domain_name
      origin_type = "s3"

      s3_config = {
        bucket_name = module.s3.buckets["frontend"].name
        manage_bucket_policy = true
      }
    }
  }
  # The default cache behavior — how CloudFront handles ALL requests
  # that do not match any ordered_cache_behaviors path pattern.
  # Built in locals.tf with secure defaults (HTTPS redirect, compression, etc.).
  default_cache_behavior = {
    target_origin_id = "frontend"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    cached_methods = ["GET", "HEAD", "OPTIONS"]
    compress = true
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03"
    smooth_streaming = false
    trusted_key_groups = []
    trusted_signers    = []
    lambda_function_associations = []
    function_associations        = []
  }
  ordered_cache_behaviors = try(var.cloudfront.ordered_cache_behaviors, [])
  custom_error_responses = try(var.cloudfront.custom_error_responses, [])
  geo_restriction = try(var.cloudfront.geo_restriction, {
    restriction_type = "none"
    locations        = []
  })

  # Origin Access Control (OAC) configuration.
  # OAC is the modern way to grant CloudFront read access to a private S3 bucket
  # using AWS Signature Version 4. It replaces the older Origin Access Identity (OAI).
  origin_access_control = {
    create           = true
    name             = "${var.cloudfront.project_name}-${var.cloudfront.environment}-web-oac"
    description      = "Origin access control for CloudFront S3 origins."
    signing_behavior = "always"
    signing_protocol = "sigv4"
  }
  aliases = var.cloudfront.aliases
  acm_certificate_arn = module.acm.certificate_arn
  ssl_support_method = "sni-only"
  minimum_protocol_version = "TLSv1.2_2021"
  price_class = try(var.cloudfront.price_class, "PriceClass_100")
  default_root_object = try(var.cloudfront.default_root_object, "index.html")
  web_acl_id = try(var.cloudfront.web_acl_id, null)
  enable_logging = true
  log_bucket_domain_name = module.s3.buckets["logs"].domain_name
  log_include_cookies = false
  log_prefix = "cloudfront/"
  tags = var.tags
}

# -----------------------------------------------------------------------------
# MODULE: route53
# -----------------------------------------------------------------------------
# Creates Route53 DNS alias records that map your custom domain names
# to the CloudFront distribution endpoint.
module "route53" {
  source = "../route53"

  default_zone_id    = var.acm.zone_id
  primary_record_key = "frontend"

  records = merge(
    {
      frontend = {
        name = var.acm.domain_name
        type = "A"
        alias = {
          name                   = module.cloudfront.distribution_domain_name
          zone_id                = module.cloudfront.hosted_zone_id
          evaluate_target_health = false
        }
      }
    },
    {
      for alias_name in toset(try(var.cloudfront.aliases, [])) :
      "cname_${replace(replace(alias_name, ".", "_"), "*", "wildcard")}" => {
        name    = alias_name
        type    = "CNAME"
        ttl     = 300
        records = [module.cloudfront.distribution_domain_name]
      }
      if trimspace(alias_name) != "" && trimspace(alias_name) != var.acm.domain_name
    }
  )
}