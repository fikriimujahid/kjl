# =============================================================================
# hosting/example.tf — Example usage for the hosting module
# =============================================================================
# This file shows a realistic, production-style example of how to use the
# hosting module. Study the comments here alongside variables.tf and README.md
# to understand the full capabilities of this module.
#
# *** THE EXAMPLE IS INTENTIONALLY COMMENTED OUT ***
# Terraform loads every *.tf file in the module directory at plan/apply time.
# An active module "example" call here would try to create real AWS resources,
# fail with missing inputs (project_name, zone_id, etc.), or conflict with
# the actual hosting module invocation in your root module.
#
# HOW TO USE THIS EXAMPLE:
#   1. Open your root module (e.g. infra/terraform/main.tf).
#   2. Copy the block below (without the leading "#" on each line).
#   3. Replace values like "kjl", "prod", "learn.kejepangdulu.com" with yours.
#   4. Run: terraform init && terraform plan
# =============================================================================

# module "marketing_site_hosting" {
#   # Path from your root module to this hosting module.
#   source = "./modules/hosting"
#
#   # -------------------------------------------------------------------------
#   # REQUIRED: Identity
#   # -------------------------------------------------------------------------
#   # Short lowercase project identifier \u2014 used in auto-generated bucket names and tags.
#   # Example auto-generated name: "kjl-prod-frontend"
#   project_name = "kjl"
#
#   # Deployment tier \u2014 used in names and the default Environment tag.
#   environment  = "prod"
#
#   # -------------------------------------------------------------------------
#   # REQUIRED: Domain configuration
#   # -------------------------------------------------------------------------
#   # Primary domain name for the TLS certificate (Common Name) and default DNS record.
#   domain_name  = "learn.kejepangdulu.com"
#
#   # Route53 hosted zone ID that owns the above domain.
#   # Find this in AWS Console \u2192 Route53 \u2192 Hosted Zones \u2192 your domain.
#   # This is used to:
#   #   1. Create the ACM DNS validation CNAME record
#   #   2. Create the website alias A/AAAA records
#   zone_id      = "Z1234567890ABCDEF"
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: Additional certificate names (SANs)
#   # -------------------------------------------------------------------------
#   # These domains will also appear on the TLS certificate.
#   # The certificate will be valid for both "learn.kejepangdulu.com" AND "www.learn.kejepangdulu.com".
#   # NOTE: Adding a SAN does NOT automatically create a DNS record for it.
#   #       Add the domain to dns_records below if you also want an A record.
#   subject_alternative_names = [
#     "www.learn.kejepangdulu.com"
#   ]
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: CloudFront alias override
#   # -------------------------------------------------------------------------
#   # By default, the module attaches ALL certificate domains as CloudFront aliases.
#   # Override here only if you want to attach fewer aliases than the cert covers.
#   # Every value here MUST be in domain_name or subject_alternative_names.
#   aliases = [
#     "learn.kejepangdulu.com",
#     "www.learn.kejepangdulu.com"
#   ]
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: Bucket settings (frontend + CloudFront logging)
#   # -------------------------------------------------------------------------
#   buckets = {
#     frontend = {
#       # Custom lifecycle rule: delete old uploaded releases after 30 days.
#       # The "releases/" prefix means only objects under that folder are affected.
#       # Objects in other folders (e.g. "assets/") are kept indefinitely.
#       lifecycle_rules = [
#         {
#           id      = "expire-build-artifacts"
#           prefix  = "releases/"
#           enabled = true
#           expiration = {
#             days = 30
#           }
#         }
#       ]
#
#       # Extra tags applied only to this S3 bucket (in addition to common_tags).
#       tags = {
#         DataClass = "public"
#       }
#     }
#
#     logging = {
#       enabled = true
#
#       # Prefix (folder path) for log files inside the bucket.
#       # "cloudfront/prod/" keeps prod logs separate from other environments
#       # if multiple distributions share a single log bucket.
#       log_prefix = "cloudfront/prod/"
#
#       bucket = {
#         # Keep log files for 180 days then automatically delete them.
#         # Adjust to match your compliance requirements (e.g. 365 days for SOC 2).
#         lifecycle_rules = [
#           {
#             id      = "expire-cloudfront-logs"
#             enabled = true
#             expiration = {
#               days = 180
#             }
#           }
#         ]
#
#         tags = {
#           DataClass = "operational"
#         }
#       }
#     }
#   }
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: Additional CloudFront origins
#   # -------------------------------------------------------------------------
#   # Add non-S3 backends (APIs, ALBs) as extra origins for this distribution.
#   # After adding an origin here, route requests to it using ordered_cache_behaviors.
#   additional_origins = {
#     # "api" is the origin ID \u2014 referenced in ordered_cache_behaviors below.
#     api = {
#       # Hostname of the API backend (Application Load Balancer in this example).
#       domain_name = "api-prod-alb-123456.ap-southeast-1.elb.amazonaws.com"
#
#       # "custom" means a plain HTTP/HTTPS endpoint, not an S3 bucket.
#       origin_type = "custom"
#
#       # Connection settings for the custom origin.
#       custom_origin_config = {
#         # Only connect to the ALB using HTTPS (recommended).
#         origin_protocol_policy = "https-only"
#
#         # Only accept TLS 1.2+ connections from CloudFront to the ALB.
#         origin_ssl_protocols   = ["TLSv1.2"]
#       }
#     }
#   }
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: CloudFront distribution settings
#   # -------------------------------------------------------------------------
#   cloudfront = {
#     # Display name in the AWS CloudFront console.
#     distribution_name       = "kjl-prod-web"
#
#     comment                 = "Primary production frontend"
#
#     # Edge location pricing tier.
#     # PriceClass_200 = US + Europe + Asia \u2014 good for Japan/SEA audience.
#     price_class             = "PriceClass_200"
#
#     # File served at the root URL "/". Required for SPAs.
#     default_root_object     = "index.html"
#
#     # Minimum TLS version. TLSv1.2_2021 blocks old insecure TLS 1.0/1.1.
#     minimum_protocol_version = "TLSv1.2_2021"
#
#     # Attach an AWS WAF Web ACL for rate limiting and attack protection.
#     # The ARN must be in us-east-1 (CloudFront is a global service).
#     web_acl_id              = "arn:aws:wafv2:us-east-1:123456789012:global/webacl/kjl-prod-web/00000000-0000-0000-0000-000000000000"
#
#     # Override specific default cache behavior settings.
#     # Fields not listed here keep the module's secure defaults.
#     default_cache_behavior = {
#       # All default requests go to the "frontend" S3 origin.
#       target_origin_id = "frontend"
#     }
#
#     # Path-specific behaviors evaluated BEFORE the default catch-all.
#     # Each entry routes a URL pattern to a specific origin.
#     ordered_cache_behaviors = [
#       {
#         # Route /api/* requests to the API origin defined above.
#         path_pattern             = "/api/*"
#         target_origin_id         = "api"
#
#         # API calls need all HTTP methods (GET, POST, PUT, DELETE, etc.).
#         allowed_methods          = ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"]
#         cached_methods           = ["GET", "HEAD", "OPTIONS"]
#
#         # Use AWS managed CachingDisabled policy for dynamic API endpoints.
#         # Cache policy ID "413f1600..." = CachingDisabled
#         cache_policy_id          = "413f1600-5d6d-4f18-83d5-94d1b54b7d4e"
#
#         # Forward all origin request headers to the API.
#         # Policy ID "216adef6..." = AllViewerExceptHostHeader
#         origin_request_policy_id = "216adef6-5c7f-47e4-b989-5492eafa07d3"
#       }
#     ]
#
#     # Custom error responses for Single-Page Application routing.
#     # When S3 returns 403 (object not found with OAC) or 404,
#     # CloudFront instead returns /index.html with HTTP 200.
#     # This lets the JavaScript router handle unknown URLs client-side.
#     custom_error_responses = [
#       {
#         error_code            = 403
#         response_code         = 200
#         response_page_path    = "/index.html"
#         error_caching_min_ttl = 0
#       },
#       {
#         error_code            = 404
#         response_code         = 200
#         response_page_path    = "/index.html"
#         error_caching_min_ttl = 0
#       }
#     ]
#   }
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: Route53 DNS records
#   # -------------------------------------------------------------------------
#   # Explicit DNS records to create. Each one becomes an ALIAS record pointing
#   # to the CloudFront distribution.
#   #
#   # This example creates four records:
#   #   - apex IPv4  (A)    for "learn.kejepangdulu.com"
#   #   - apex IPv6  (AAAA) for "learn.kejepangdulu.com"
#   #   - www IPv4   (A)    for "www.learn.kejepangdulu.com"
#   #   - www IPv6   (AAAA) for "www.learn.kejepangdulu.com"
#   #
#   # Having both A and AAAA records ensures IPv6 users resolve correctly.
#   dns_records = {
#     apex_ipv4 = {
#       name = "learn.kejepangdulu.com"
#       type = "A"
#     }
#     apex_ipv6 = {
#       name = "learn.kejepangdulu.com"
#       type = "AAAA"
#     }
#     www_ipv4 = {
#       name = "www.learn.kejepangdulu.com"
#       type = "A"
#     }
#     www_ipv6 = {
#       name = "www.learn.kejepangdulu.com"
#       type = "AAAA"
#     }
#   }
#
#   # The key whose FQDN is used as the module's fqdn output.
#   # "apex_ipv4" \u2192 fqdn = "learn.kejepangdulu.com"
#   primary_dns_record_key = "apex_ipv4"
#
#   # -------------------------------------------------------------------------
#   # OPTIONAL: Extra resource tags
#   # -------------------------------------------------------------------------
#   # Merged on top of the module's built-in Project/Environment/ManagedBy/Module tags.
#   tags = {
#     Owner       = "platform"
#     CostCenter  = "education"
#     Application = "web"
#   }
# }