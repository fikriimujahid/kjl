# ---------------------------------------------------------------------------
# example.tf
#
# This file is NOT deployed — it is a reference guide showing how to call
# this module.  The entire content is wrapped in a block comment (/* ... */)
# so Terraform ignores it.
#
# Read this file first when you want to understand how to use this module.
# Copy the module block into your own .tf file, adjust the values, and run
# terraform init / plan / apply.
# ---------------------------------------------------------------------------

/*
============================================================================
Example — Production-style CloudFront deployment
============================================================================

This example covers a typical web application setup:
  - Static frontend assets served from a private S3 bucket
  - Backend REST API served from a custom HTTPS origin
  - SPA-friendly custom error responses (404 → serve /index.html)
  - An ordered cache behavior routing /api/* to the API origin
  - Standard access logging captured in a dedicated S3 bucket
  - A custom domain with an ACM TLS certificate

Prerequisites:
  1. An S3 bucket named "kejepangdulu-prod-frontend" already exists.
  2. An ACM certificate for "app.kejepangdulu.click" exists in us-east-1.
  3. A separate S3 bucket "kejepangdulu-prod-cdn-logs" exists for log storage.
     The bucket must grant CloudFront write access (ACL or bucket policy).
============================================================================

module "frontend_cdn" {
  # source points to the module directory relative to the calling root module.
  # Adjust the path if your folder layout differs.
  source = "./modules/cloudfront"

  # -------------------------------------------------------------------------
  # Naming — forms the display name "kejepangdulu-prod-cloudfront" by default.
  # -------------------------------------------------------------------------
  project_name = "kejepangdulu"
  environment  = "prod"

  # -------------------------------------------------------------------------
  # Custom domain + TLS
  # aliases is a list of CNAME hostnames that should reach this distribution.
  # acm_certificate_arn MUST reference a certificate in us-east-1.
  # -------------------------------------------------------------------------
  aliases             = ["app.kejepangdulu.click"]
  acm_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/11111111-2222-3333-4444-555555555555"

  # -------------------------------------------------------------------------
  # Origins — where CloudFront fetches content from.
  # The map KEY is the origin ID referenced by cache behaviors below.
  # -------------------------------------------------------------------------
  origins = {
    # "frontend" — private S3 bucket served via OAC.
    # domain_name is the S3 REST endpoint (not the website endpoint).
    frontend = {
      origin_type = "s3"
      domain_name = "kejepangdulu-prod-frontend.s3.ap-southeast-1.amazonaws.com"

      s3_config = {
        # bucket_name allows the module to build the correct IAM policy ARN.
        bucket_name = "kejepangdulu-prod-frontend"
        # manage_bucket_policy = true means this module creates and attaches
        # the S3 bucket policy automatically.  Set to false if the bucket
        # policy is managed by a different Terraform module or stack.
        manage_bucket_policy = true
      }
    }

    # "api" — custom HTTPS origin (ALB, API Gateway, or any HTTPS server).
    api = {
      origin_type = "custom"
      domain_name = "api.kejepangdulu.click"
      # origin_path is prepended to every request forwarded to this origin.
      # "/v1" means a viewer request to "/api/users" becomes "/v1/api/users".
      origin_path = "/v1"

      custom_origin_config = {
        # https-only ensures CloudFront only talks to the origin over TLS.
        origin_protocol_policy   = "https-only"
        # Minimum TLS version the origin's certificate must satisfy.
        origin_ssl_protocols     = ["TLSv1.2"]
        # Seconds a keep-alive connection stays open between requests.
        origin_keepalive_timeout = 10
        # Seconds CloudFront waits for a response before retrying/failing.
        origin_read_timeout      = 30
      }
    }
  }

  # -------------------------------------------------------------------------
  # Default cache behavior
  # Applied to all requests that do not match an ordered behavior below.
  # Here, all unmatched paths serve the frontend S3 bucket.
  # -------------------------------------------------------------------------
  default_cache_behavior = {
    # Connects this behavior to the "frontend" origin defined above.
    target_origin_id = "frontend"
    # Automatically redirect HTTP → HTTPS so all connections are encrypted.
    viewer_protocol_policy = "redirect-to-https"
    # Allow read + preflight requests only.  Prevents mutation via CDN.
    allowed_methods = ["GET", "HEAD", "OPTIONS"]
    cached_methods  = ["GET", "HEAD", "OPTIONS"]
    # Enable gzip/Brotli compression to reduce transfer sizes.
    compress = true
    # Uses AWS managed CachingOptimized policy — good default for S3 content.
    # Omitting cache_policy_id here uses the module default for this field.
  }

  # -------------------------------------------------------------------------
  # Ordered cache behaviors
  # Evaluated IN ORDER before the default behavior above.
  # The first path_pattern match wins.
  # -------------------------------------------------------------------------
  ordered_cache_behaviors = [
    {
      # Route all /api/* requests to the API origin.
      path_pattern     = "/api/*"
      target_origin_id = "api"
      # Strictly HTTPS — never allow unencrypted API calls.
      viewer_protocol_policy = "https-only"
      # Allow all HTTP methods so the API can receive POST/PUT/DELETE etc.
      allowed_methods = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
      # Cache only safe read methods; never cache mutating calls.
      cached_methods = ["GET", "HEAD", "OPTIONS"]
      # CachingDisabled managed policy: TTL 0, nothing is cached at the edge.
      # Use this for dynamic API endpoints that must never be served stale.
      cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
      # AllViewer managed policy: forwards all viewer headers, cookies, and
      # query strings to the origin, preserving authentication context.
      origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
    }
  ]

  # -------------------------------------------------------------------------
  # Custom error responses
  # Override what CloudFront returns when the S3 origin reports an error.
  # This pattern is required for Single Page Applications (SPAs):
  #   When a user navigates directly to /dashboard, S3 returns 403 (no such
  #   object).  Without this rule CloudFront would show a raw 403 XML page.
  #   With this rule CloudFront returns /index.html with status 200, and the
  #   React/Vue/Angular router takes over and renders the correct page.
  # -------------------------------------------------------------------------
  custom_error_responses = [
    {
      # When S3 returns 403 (object does not exist in a private bucket):
      error_code         = 403
      response_code      = 200           # Send 200 to the browser.
      response_page_path = "/index.html" # Serve the SPA entry point.
      # Do not cache this redirect — the URL may become valid later.
      error_caching_min_ttl = 0
    },
    {
      # When S3 returns 404 (object truly missing):
      error_code            = 404
      response_code         = 200
      response_page_path    = "/index.html"
      error_caching_min_ttl = 0
    }
  ]

  # -------------------------------------------------------------------------
  # Origin Access Control
  # create = true tells the module to create a new OAC and attach it to all
  # S3 origins.  This replaces the older OAI (Origin Access Identity) approach.
  # -------------------------------------------------------------------------
  origin_access_control = {
    create = true
  }

  # -------------------------------------------------------------------------
  # Access logging
  # Stores one-line access records in the log bucket under the given prefix.
  # Required for auditing, debugging, and cost attribution.
  # -------------------------------------------------------------------------
  enable_logging         = true
  log_bucket_domain_name = "kejepangdulu-prod-cdn-logs.s3.amazonaws.com"
  log_prefix             = "cloudfront/frontend/"

  # -------------------------------------------------------------------------
  # Tagging
  # Tags flow through to all resources this module creates:
  #   - aws_cloudfront_distribution
  # Standard tags help with cost reporting and resource governance.
  # -------------------------------------------------------------------------
  tags = {
    Project     = "kejepangdulu"
    Environment = "prod"
    ManagedBy   = "Terraform"
    Service     = "frontend"
  }
}
*/