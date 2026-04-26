# -----------------------------------------------------------------------------
# MODULE: s3 (static-hosting)
# -----------------------------------------------------------------------------
# Creates the S3 bucket that stores website assets.
module "s3_static_hosting" {
  source = "../s3"

  bucket_name        = var.s3_static_hosting.bucket_name
  force_destroy      = false
  tags               = var.tags
  versioning_enabled = false
  encryption = {
    sse_algorithm      = "AES256"
    kms_master_key_id  = null
    bucket_key_enabled = true
  }
  lifecycle_config = {
    lifecycle_days  = null
    lifecycle_rules = []
  }

  security = {
    public_access_block = {
      block_public_acls       = true
      block_public_policy     = true
      ignore_public_acls      = true
      restrict_public_buckets = true
    }
    object_ownership            = "BucketOwnerEnforced"
    attach_tls_only_policy      = false
    additional_policy_documents = []
  }
}


# -----------------------------------------------------------------------------
# MODULE: s3_logs
# -----------------------------------------------------------------------------
# Creates the S3 bucket used for CloudFront access logs.
module "s3_logs" {
  source = "../s3"

  bucket_name        = var.s3_cloudfront_log.bucket_name
  force_destroy      = false
  tags               = var.tags
  versioning_enabled = true
  encryption = {
    sse_algorithm      = "AES256"
    kms_master_key_id  = null
    bucket_key_enabled = true
  }
  lifecycle_config = {
    lifecycle_days = try(var.s3_cloudfront_log.lifecycle_days, 90)
    lifecycle_rules = [
      for rule in try(var.s3_cloudfront_log.lifecycle_rules, []) : {
        id              = rule.id
        enabled         = rule.enabled
        prefix          = try(rule.prefix, null)
        expiration_days = try(rule.expiration.days, null)
      }
    ]
  }
  security = {
    public_access_block = {
      block_public_acls       = true
      block_public_policy     = true
      ignore_public_acls      = true
      restrict_public_buckets = true
    }
    object_ownership            = "BucketOwnerPreferred"
    additional_policy_documents = []
  }
}

# -----------------------------------------------------------------------------
# RESOURCE: CloudFront Function
# -----------------------------------------------------------------------------
# Rewrites extensionless requests like /login to /login/index.html so static
# Next.js export routes work correctly behind a private S3 origin.
resource "aws_cloudfront_function" "directory_index_rewrite" {
  name    = "${var.cloudfront.project_name}-${var.cloudfront.environment}-directory-index-rewrite"
  runtime = "cloudfront-js-1.0"
  comment = "Rewrite extensionless routes to directory index.html objects."
  publish = true

  code = <<-EOF
    function handler(event) {
      var request = event.request;
      var uri = request.uri;

      if (uri === "/") {
        return request;
      }

      if (uri.endsWith("/")) {
        request.uri = uri + "index.html";
        return request;
      }

      if (!uri.includes(".")) {
        request.uri = uri + "/index.html";
      }

      return request;
    }
  EOF
}

# -----------------------------------------------------------------------------
# MODULE: acm
# -----------------------------------------------------------------------------
# Requests an AWS Certificate Manager (ACM) TLS certificate for your domain
# and waits for DNS validation to complete before continuing.
module "acm" {
  source = "../acm"

  existing_certificate_arn                 = try(trimspace(var.acm.existing_certificate_arn), "") == "" ? null : try(trimspace(var.acm.existing_certificate_arn), "")
  domain_name                              = try(var.acm.domain_name, null)
  subject_alternative_names                = try(var.acm.subject_alternative_names, [])
  zone_id                                  = try(var.acm.zone_id, null)
  validation_zone_ids                      = try(var.acm.validation_zone_ids, {})
  validation_record_fqdns                  = try(var.acm.validation_record_fqdns, [])
  validation_record_ttl                    = 60
  wait_for_validation                      = true
  certificate_region                       = "us-east-1"
  key_algorithm                            = "RSA_2048"
  certificate_transparency_logging_enabled = true
  tags                                     = var.tags
}

# -----------------------------------------------------------------------------
# MODULE: cloudfront
# -----------------------------------------------------------------------------
# Creates the Amazon CloudFront CDN distribution that serves your website.
module "cloudfront" {
  source = "../cloudfront"

  project_name                    = var.cloudfront.project_name
  environment                     = var.cloudfront.environment
  distribution_name               = "${var.cloudfront.project_name}-${var.cloudfront.environment}-web"
  comment                         = "${var.cloudfront.project_name}-${var.cloudfront.environment}-web"
  enabled                         = true
  is_ipv6_enabled                 = true
  wait_for_deployment             = true
  retain_on_delete                = false
  continuous_deployment_policy_id = try(var.cloudfront.continuous_deployment_policy_id, null)
  http_version                    = "http2and3"
  origins = merge(
    {
      frontend = {
        domain_name = module.s3_static_hosting.bucket_regional_domain_name
        origin_type = "s3"

        s3_config = {
          bucket_name          = module.s3_static_hosting.bucket_name
          manage_bucket_policy = true
        }
      }
    },
    try(var.cloudfront.public_origin.enabled, false) ? {
      public = {
        domain_name = var.cloudfront.public_origin.bucket_regional_domain_name
        origin_type = "s3"

        s3_config = {
          bucket_name          = var.cloudfront.public_origin.bucket_name
          manage_bucket_policy = try(var.cloudfront.public_origin.manage_bucket_policy, true)
        }
      }
    } : {}
  )
  # The default cache behavior — how CloudFront handles ALL requests
  # that do not match any ordered_cache_behaviors path pattern.
  # Built in locals.tf with secure defaults (HTTPS redirect, compression, etc.).
  default_cache_behavior = {
    target_origin_id             = "frontend"
    viewer_protocol_policy       = "redirect-to-https"
    allowed_methods              = ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    cached_methods               = ["GET", "HEAD", "OPTIONS"]
    compress                     = true
    cache_policy_id              = "658327ea-f89d-4fab-a63d-7e88639e58f6"
    response_headers_policy_id   = "67f7725c-6f97-4210-82d7-5512b31e9d03"
    smooth_streaming             = false
    trusted_key_groups           = []
    trusted_signers              = []
    lambda_function_associations = []
    function_associations = [
      {
        event_type   = "viewer-request"
        function_arn = aws_cloudfront_function.directory_index_rewrite.arn
      }
    ]
  }
  ordered_cache_behaviors = concat(
    try(var.cloudfront.public_origin.enabled, false) ? [
      {
        path_pattern               = "/public-data/*"
        target_origin_id           = "public"
        viewer_protocol_policy     = "redirect-to-https"
        allowed_methods            = ["GET", "HEAD", "OPTIONS"]
        cached_methods             = ["GET", "HEAD", "OPTIONS"]
        compress                   = true
        cache_policy_id            = "658327ea-f89d-4fab-a63d-7e88639e58f6"
        response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03"
      }
    ] : [],
    try(var.cloudfront.ordered_cache_behaviors, [])
  )
  custom_error_responses  = try(var.cloudfront.custom_error_responses, [])
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
  aliases                  = var.cloudfront.aliases
  acm_certificate_arn      = module.acm.certificate_arn
  ssl_support_method       = "sni-only"
  minimum_protocol_version = "TLSv1.2_2021"
  price_class              = try(var.cloudfront.price_class, "PriceClass_100")
  default_root_object      = try(var.cloudfront.default_root_object, "index.html")
  web_acl_id               = try(var.cloudfront.web_acl_id, null)
  enable_logging           = true
  log_bucket_domain_name   = module.s3_logs.bucket_domain_name
  log_include_cookies      = false
  log_prefix               = "cloudfront/"
  tags                     = var.tags
}

# -----------------------------------------------------------------------------
# MODULE: route53
# -----------------------------------------------------------------------------
# Creates Route53 DNS alias records that map your custom domain names
# to the CloudFront distribution endpoint.
# -----------------------------------------------------------------------------
# MODULE: route53
# -----------------------------------------------------------------------------
# Create DNS records for CloudFront

module "route53" {
  source = "../route53"

  default_zone_id = var.cloudfront.zone_id

  records = try(trimspace(var.acm.existing_certificate_arn), "") != "" ? tomap({
    for alias_name in toset(try(var.cloudfront.aliases, [])) :
    alias_name => {
      name    = alias_name
      type    = "CNAME"
      ttl     = 300
      records = [module.cloudfront.distribution_domain_name]
      alias   = null
    }
    if trimspace(alias_name) != ""
    }) : tomap(merge(
    {
      frontend = {
        name    = var.acm.domain_name
        type    = "A"
        ttl     = null
        records = null
        alias = {
          name                   = module.cloudfront.distribution_domain_name
          zone_id                = module.cloudfront.hosted_zone_id
          evaluate_target_health = false
        }
      }
    },
    {
      for alias_name in toset(try(var.cloudfront.aliases, [])) :
      alias_name => {
        name    = alias_name
        type    = "CNAME"
        ttl     = 300
        records = [module.cloudfront.distribution_domain_name]
        alias   = null
      }
      if trimspace(alias_name) != "" && alias_name != var.acm.domain_name
    }
  ))
}