# ---------------------------------------------------------------------------
# variables.tf
#
# This file is the public interface of the CloudFront module.
# Every value a caller can or must provide is declared here as a "variable".
#
# Key concepts for beginners:
#
#   variable "name" { ... }
#     Declares one input.  The caller sets it in their module {} block.
#
#   type = string / bool / number / list(...) / map(...) / object({...})
#     The Terraform type system.  Terraform validates the caller's value
#     against this type before running any resource.
#
#   default = ...
#     Makes the variable optional.  If the caller does not set it, the
#     default is used.  Variables without a default are REQUIRED.
#
#   validation { condition = ... error_message = ... }
#     Custom rules checked before Terraform talks to AWS.  If condition
#     evaluates to false, Terraform prints error_message and stops.
#     This gives developers clear, friendly errors instead of cryptic
#     AWS API responses.
#
#   optional(type, default)
#     Used inside object types to mark a field as optional with its own
#     default value.  Available since Terraform 1.3.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Naming and identification
# ---------------------------------------------------------------------------

# project_name
# Required.  A short identifier for the project.
# Used in the auto-generated distribution comment and OAC name.
# Example: "kjl" → distribution named "kjl-prod-cloudfront"
variable "project_name" {
  description = "Project identifier used by the default naming convention."
  type        = string

  # Validation: refuse an entirely whitespace or empty string.
  # trimspace() strips leading/trailing spaces before checking length.
  validation {
    condition     = length(trimspace(var.project_name)) > 0
    error_message = "project_name must not be empty."
  }
}

# environment
# Required.  The deployment stage ("dev", "staging", "prod", etc.).
# Combined with project_name to form resource display names.
variable "environment" {
  description = "Environment identifier used by the default naming convention."
  type        = string

  validation {
    condition     = length(trimspace(var.environment)) > 0
    error_message = "environment must not be empty."
  }
}

# distribution_name
# Optional override for the auto-generated comment and OAC name.
# When null, main.tf uses "<project_name>-<environment>-cloudfront".
variable "distribution_name" {
  description = "Optional name override used when generating the distribution comment and OAC name."
  type        = string
  default     = null
}

# comment
# Optional free-text label shown next to the distribution in the AWS Console.
# When null, the distribution_name local (auto-generated) is used instead.
variable "comment" {
  description = "Optional CloudFront distribution comment. Defaults to the generated distribution name."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# Distribution behaviour flags
# ---------------------------------------------------------------------------

# enabled
# Whether the distribution is active and serving traffic.
# Set to false to pause it without destroying it.
variable "enabled" {
  description = "Whether the CloudFront distribution is enabled."
  type        = bool
  default     = true
}

# is_ipv6_enabled
# Allow IPv6 clients to reach this distribution.
# Recommended: true.  Disabling it excludes modern networks unnecessarily.
variable "is_ipv6_enabled" {
  description = "Whether IPv6 is enabled for the distribution."
  type        = bool
  default     = true
}

# wait_for_deployment
# When true, "terraform apply" blocks until CloudFront reports "Deployed".
# Deployment can take 5–15 minutes.  Useful when downstream resources
# (e.g. Route53 records) must only be created after the CDN is live.
variable "wait_for_deployment" {
  description = "Whether Terraform should wait for the distribution deployment to complete."
  type        = bool
  default     = true
}

# retain_on_delete
# When true, "terraform destroy" DISABLES the distribution instead of
# deleting it.  Prevents accidental full deletion in production.
# You then need to manually delete it in the AWS Console.
variable "retain_on_delete" {
  description = "Whether Terraform should disable the distribution instead of deleting it immediately."
  type        = bool
  default     = false
}

# continuous_deployment_policy_id
# Links this distribution to a CloudFront continuous deployment policy.
# Used for blue/green or weighted traffic shifting between two distributions.
# Leave null (the default) for standard single-distribution setups.
variable "continuous_deployment_policy_id" {
  description = "Optional CloudFront continuous deployment policy ID."
  type        = string
  default     = null
}

# http_version
# The highest HTTP version CloudFront negotiates with browsers.
# "http2and3" is the recommended default — it supports both HTTP/2 multiplexing
# and HTTP/3 (QUIC) for lowest latency on modern clients.
variable "http_version" {
  description = "HTTP version supported by the distribution."
  type        = string
  default     = "http2and3"

  # Only the four values the CloudFront API accepts are valid.
  # This catches typos before the AWS API call.
  validation {
    condition     = contains(["http1.1", "http2", "http2and3", "http3"], var.http_version)
    error_message = "http_version must be one of http1.1, http2, http2and3, or http3."
  }
}

# ---------------------------------------------------------------------------
# Origins
# ---------------------------------------------------------------------------

# origins
# Required.  A map of origin definitions.
# Each entry in the map becomes one "origin" block inside the CloudFront
# distribution.
#
# Map key = the CloudFront origin ID.
#   - This ID links an origin to a cache behavior (target_origin_id).
#   - Use a descriptive key, e.g. "frontend" or "api".
#
# Map value = an object with these fields:
#   domain_name         — the DNS name CloudFront forwards requests to
#   origin_type         — "s3" for S3 buckets, "custom" for everything else
#   origin_path         — (optional) prefix appended to forwarded request paths
#   connection_attempts — retries on failed connections (1–3)
#   connection_timeout  — seconds before giving up on a connection (1–10)
#   custom_headers      — extra HTTP headers to inject into origin requests
#   custom_origin_config— TCP/TLS settings for non-S3 origins
#   origin_shield       — optional extra caching layer between edge and origin
#   s3_config           — S3-specific settings (bucket name, policy management)
variable "origins" {
  description = "Map of origin definitions keyed by the CloudFront origin ID."

  type = map(object({
    # The DNS hostname or S3 endpoint CloudFront connects to.
    domain_name = string
    # "s3" for S3 buckets; "custom" for ALB, API Gateway, plain HTTPS servers.
    origin_type = string
    # Optional path prefix added to all requests forwarded to this origin.
    origin_path = optional(string)
    # How many times CloudFront retries a failed TCP connection. Range: 1–3.
    connection_attempts = optional(number, 3)
    # Seconds CloudFront waits for a TCP connection. Range: 1–10.
    connection_timeout = optional(number, 10)
    # Key-value pairs added as HTTP headers to every origin request.
    custom_headers = optional(map(string), {})

    # TCP and TLS configuration for non-S3 (custom) origins.
    # Only used when origin_type = "custom"; ignored for S3 origins.
    custom_origin_config = optional(object({
      http_port                = optional(number, 80)
      https_port               = optional(number, 443)
      # "https-only" means CloudFront only connects to the origin over HTTPS.
      origin_protocol_policy   = optional(string, "https-only")
      # TLS versions CloudFront accepts from the origin's server cert.
      origin_ssl_protocols     = optional(list(string), ["TLSv1.2"])
      # Seconds an idle keep-alive connection stays open. Range: 1–60.
      origin_keepalive_timeout = optional(number, 5)
      # Seconds CloudFront waits for origin to respond. Range: 1–60.
      origin_read_timeout      = optional(number, 30)
    }))

    # Origin Shield is an optional extra caching tier. When enabled, CloudFront
    # routes cache misses from all edge locations through one Shield region,
    # reducing requests that reach the actual origin.
    origin_shield = optional(object({
      enabled              = optional(bool, false)
      # AWS region for Origin Shield, e.g. "ap-southeast-1".
      origin_shield_region = optional(string)
    }), {})

    # S3-specific configuration. Only relevant when origin_type = "s3".
    s3_config = optional(object({
      # Explicit bucket name used in IAM policy ARNs.  If omitted, the module
      # derives the name from the domain_name field.
      bucket_name = optional(string)
      # When true (default), the module creates and attaches a bucket policy.
      # Set to false for shared buckets managed by another Terraform module.
      manage_bucket_policy = optional(bool, true)
    }), {})
  }))

  # Validation 1: at least one origin must be provided.
  validation {
    condition     = length(var.origins) > 0
    error_message = "origins must contain at least one origin definition."
  }

  # Validation 2: origin_type must be "s3" or "custom".
  # values(var.origins) returns a list of all origin objects.
  # alltrue() returns true only when every element in the list is true.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      contains(["s3", "custom"], origin.origin_type)
    ])
    error_message = "Each origin.origin_type must be either 's3' or 'custom'."
  }

  # Validation 3: connection_attempts must be 1–3.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.connection_attempts >= 1 && origin.connection_attempts <= 3
    ])
    error_message = "Each origin.connection_attempts value must be between 1 and 3."
  }

  # Validation 4: connection_timeout must be 1–10 seconds.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.connection_timeout >= 1 && origin.connection_timeout <= 10
    ])
    error_message = "Each origin.connection_timeout value must be between 1 and 10 seconds."
  }

  # Validation 5: S3 origins must not include custom_origin_config.
  # custom_origin_config only makes sense for HTTP/HTTPS servers, not S3.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "s3" || try(origin.custom_origin_config, null) == null
    ])
    error_message = "S3 origins must not define custom_origin_config."
  }

  # Validation 6: custom origins must use a valid origin_protocol_policy.
  # try(..., "https-only") handles the case where custom_origin_config is absent.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "custom" || contains(["http-only", "https-only", "match-viewer"], try(origin.custom_origin_config.origin_protocol_policy, "https-only"))
    ])
    error_message = "custom_origin_config.origin_protocol_policy must be http-only, https-only, or match-viewer."
  }

  # Validation 7: custom origins must use only recognised TLS protocol names.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "custom" || alltrue([
        for protocol in try(origin.custom_origin_config.origin_ssl_protocols, ["TLSv1.2"]) :
        contains(["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2"], protocol)
      ])
    ])
    error_message = "custom_origin_config.origin_ssl_protocols may contain only SSLv3, TLSv1, TLSv1.1, or TLSv1.2."
  }

  # Validation 8: keepalive and read timeouts must both be 1–60 seconds.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "custom" || (
        try(origin.custom_origin_config.origin_keepalive_timeout, 5) >= 1 &&
        try(origin.custom_origin_config.origin_keepalive_timeout, 5) <= 60 &&
        try(origin.custom_origin_config.origin_read_timeout, 30) >= 1 &&
        try(origin.custom_origin_config.origin_read_timeout, 30) <= 60
      )
    ])
    error_message = "custom_origin_config origin_keepalive_timeout and origin_read_timeout must both be between 1 and 60 seconds."
  }

  # Validation 9: when Origin Shield is enabled, a valid AWS region must be provided.
  # can(regex(...)) returns true if the string matches the pattern.
  # The pattern "^[a-z]{2}-[a-z]+-[0-9]+$" matches region names like "ap-southeast-1".
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      !try(origin.origin_shield.enabled, false) || can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", try(origin.origin_shield.origin_shield_region, "")))
    ])
    error_message = "origin_shield.origin_shield_region must be a valid AWS region when origin_shield.enabled is true."
  }

  # Validation 10: S3 origins must use REST endpoints, not website endpoints.
  # S3 website endpoints (e.g. my-bucket.s3-website-us-east-1.amazonaws.com)
  # do not support OAC; REST endpoints (e.g. my-bucket.s3.amazonaws.com) do.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "s3" || !can(regex("s3-website[.-]", origin.domain_name))
    ])
    error_message = "S3 origins must use an S3 REST endpoint, not an S3 website endpoint."
  }

  # Validation 11: if manage_bucket_policy = true, the module must be able to
  # resolve the bucket name.  Either s3_config.bucket_name must be set, or the
  # domain_name must contain ".s3" so the name can be derived from it.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "s3" || !try(origin.s3_config.manage_bucket_policy, true) || (
        try(origin.s3_config.bucket_name, null) != null || strcontains(origin.domain_name, ".s3")
      )
    ])
    error_message = "S3 origins that manage bucket policies must provide s3_config.bucket_name or use an S3 REST endpoint domain name that contains '.s3'."
  }

  # Validation 12: if s3_config.bucket_name is explicitly provided, it must
  # satisfy S3 naming rules: lowercase alphanumeric + dots + hyphens, 3–63 chars,
  # no consecutive dots, and not formatted like an IP address.
  validation {
    condition = alltrue([
      for origin in values(var.origins) :
      origin.origin_type != "s3" || try(origin.s3_config.bucket_name, null) == null || (
        can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", origin.s3_config.bucket_name)) &&
        length(regexall("\\.\\.", origin.s3_config.bucket_name)) == 0 &&
        length(regexall("^\\d+\\.\\d+\\.\\d+\\.\\d+$", origin.s3_config.bucket_name)) == 0
      )
    ])
    error_message = "Each s3_config.bucket_name must be a valid S3 bucket name."
  }
}

# ---------------------------------------------------------------------------
# Cache behaviors
# ---------------------------------------------------------------------------

# default_cache_behavior
# Required.  Defines how CloudFront handles requests that do not match any
# ordered cache behavior.  Every distribution must have exactly one.
#
# Key fields:
#   target_origin_id   — which origin receives requests for this behavior
#   viewer_protocol_policy — how CloudFront handles HTTP vs HTTPS from viewers
#   allowed_methods    — which HTTP verbs CloudFront accepts
#   cache_policy_id    — controls TTL and cache key (headers, cookies, params)
#   response_headers_policy_id — adds security headers (HSTS, CSP, etc.)
variable "default_cache_behavior" {
  description = "Default cache behavior for the distribution."

  type = object({
    # Required: the key from var.origins that receives requests for this behavior.
    target_origin_id = string
    # How to handle viewer HTTP requests. Default: redirect-to-https (recommended).
    viewer_protocol_policy = optional(string, "redirect-to-https")
    # HTTP methods CloudFront accepts. Default: GET/HEAD/OPTIONS (read-only).
    allowed_methods = optional(list(string), ["GET", "HEAD", "OPTIONS"])
    # Methods whose responses CloudFront caches. Must be a subset of allowed_methods.
    cached_methods = optional(list(string), ["GET", "HEAD", "OPTIONS"])
    # Compress text responses with gzip/Brotli before sending to viewers.
    compress = optional(bool, true)
    # AWS CachingOptimized managed policy ID (good default for S3 static content).
    cache_policy_id = optional(string, "658327ea-f89d-4fab-a63d-7e88639e58f6")
    # Which headers/cookies/query strings to forward to the origin on cache miss.
    origin_request_policy_id = optional(string)
    # AWS SecurityHeadersPolicy managed policy ID (adds HSTS, X-Frame, CSP, etc.).
    response_headers_policy_id = optional(string, "67f7725c-6f97-4210-82d7-5512b31e9d03")
    # ARN of a Kinesis Data Streams real-time log configuration.
    realtime_log_config_arn = optional(string)
    # Enable Microsoft Smooth Streaming for live video. Almost always false.
    smooth_streaming = optional(bool, false)
    # ID of a field-level encryption profile for encrypting POST body fields.
    field_level_encryption_id = optional(string)
    # CloudFront Key Group IDs for signed URL/cookie validation.
    trusted_key_groups = optional(list(string), [])
    # Deprecated: AWS account IDs for signed URLs. Use trusted_key_groups instead.
    trusted_signers = optional(list(string), [])
    # Lambda@Edge functions to invoke at specific request/response lifecycle events.
    lambda_function_associations = optional(list(object({
      event_type   = string           # viewer-request, origin-request, etc.
      lambda_arn   = string           # versioned Lambda ARN
      include_body = optional(bool, false) # pass request body to Lambda
    })), [])
    # CloudFront Functions (lightweight JS) to invoke at viewer events.
    function_associations = optional(list(object({
      event_type   = string  # viewer-request or viewer-response only
      function_arn = string
    })), [])
  })

  # viewer_protocol_policy must be one of the three allowed values.
  validation {
    condition = contains(
      ["allow-all", "https-only", "redirect-to-https"],
      var.default_cache_behavior.viewer_protocol_policy
    )
    error_message = "default_cache_behavior.viewer_protocol_policy must be allow-all, https-only, or redirect-to-https."
  }

  # All items in allowed_methods must be recognised HTTP verbs.
  validation {
    condition = alltrue([
      for method in var.default_cache_behavior.allowed_methods :
      contains(["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"], method)
    ])
    error_message = "default_cache_behavior.allowed_methods contains an invalid HTTP method."
  }

  # cached_methods must be a subset of allowed_methods.
  # It makes no sense to cache methods that are not even allowed.
  validation {
    condition = alltrue([
      for method in var.default_cache_behavior.cached_methods :
      contains(var.default_cache_behavior.allowed_methods, method)
    ])
    error_message = "default_cache_behavior.cached_methods must be a subset of default_cache_behavior.allowed_methods."
  }

  # target_origin_id must match one of the keys in var.origins.
  # keys() returns the list of map keys; contains() checks membership.
  validation {
    condition     = contains(keys(var.origins), var.default_cache_behavior.target_origin_id)
    error_message = "default_cache_behavior.target_origin_id must match one of the keys in origins."
  }

  # Lambda@Edge event types must be one of the four allowed values.
  validation {
    condition = alltrue([
      for association in var.default_cache_behavior.lambda_function_associations :
      contains(["viewer-request", "origin-request", "viewer-response", "origin-response"], association.event_type)
    ])
    error_message = "default_cache_behavior.lambda_function_associations event_type must be viewer-request, origin-request, viewer-response, or origin-response."
  }

  # CloudFront Function event types are limited to viewer-request and viewer-response.
  validation {
    condition = alltrue([
      for association in var.default_cache_behavior.function_associations :
      contains(["viewer-request", "viewer-response"], association.event_type)
    ])
    error_message = "default_cache_behavior.function_associations event_type must be viewer-request or viewer-response."
  }
}

# ordered_cache_behaviors
# Optional list of additional cache behaviors evaluated BEFORE the default.
# CloudFront tests each behavior's path_pattern in order.
# The first match wins; if none match, the default behavior is used.
# Example: route "/api/*" to an API origin, serve everything else from S3.
variable "ordered_cache_behaviors" {
  description = "Optional ordered cache behaviors applied before the default cache behavior."

  type = list(object({
    # The URL path pattern this behavior applies to. Example: "/api/*".
    path_pattern = string
    # Origin ID to forward matched requests to.
    target_origin_id = string
    # Same semantics as default_cache_behavior fields below.
    viewer_protocol_policy     = optional(string, "redirect-to-https")
    allowed_methods            = optional(list(string), ["GET", "HEAD", "OPTIONS"])
    cached_methods             = optional(list(string), ["GET", "HEAD", "OPTIONS"])
    compress                   = optional(bool, true)
    cache_policy_id            = optional(string, "658327ea-f89d-4fab-a63d-7e88639e58f6")
    origin_request_policy_id   = optional(string)
    response_headers_policy_id = optional(string, "67f7725c-6f97-4210-82d7-5512b31e9d03")
    realtime_log_config_arn    = optional(string)
    smooth_streaming           = optional(bool, false)
    field_level_encryption_id  = optional(string)
    trusted_key_groups         = optional(list(string), [])
    trusted_signers            = optional(list(string), [])
    lambda_function_associations = optional(list(object({
      event_type   = string
      lambda_arn   = string
      include_body = optional(bool, false)
    })), [])
    function_associations = optional(list(object({
      event_type   = string
      function_arn = string
    })), [])
  }))

  # Default is an empty list: no ordered behaviors are configured unless set.
  default = []

  # path_pattern must not be an empty or whitespace-only string.
  validation {
    condition = alltrue([
      for behavior in var.ordered_cache_behaviors :
      length(trimspace(behavior.path_pattern)) > 0
    ])
    error_message = "Each ordered_cache_behaviors.path_pattern value must not be empty."
  }

  # target_origin_id in each ordered behavior must reference an existing origin key.
  validation {
    condition = alltrue([
      for behavior in var.ordered_cache_behaviors :
      contains(keys(var.origins), behavior.target_origin_id)
    ])
    error_message = "Each ordered cache behavior target_origin_id must match one of the origin keys."
  }

  # viewer_protocol_policy must be one of the three valid values.
  validation {
    condition = alltrue([
      for behavior in var.ordered_cache_behaviors :
      contains(["allow-all", "https-only", "redirect-to-https"], try(behavior.viewer_protocol_policy, "redirect-to-https"))
    ])
    error_message = "Each ordered cache behavior viewer_protocol_policy must be allow-all, https-only, or redirect-to-https."
  }

  # All HTTP methods in allowed_methods must be known verbs.
  # flatten() collapses the nested list (one list per behavior) into one flat list.
  validation {
    condition = alltrue(flatten([
      for behavior in var.ordered_cache_behaviors : [
        for method in try(behavior.allowed_methods, ["GET", "HEAD", "OPTIONS"]) :
        contains(["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"], method)
      ]
    ]))
    error_message = "ordered_cache_behaviors.allowed_methods contains an invalid HTTP method."
  }

  # cached_methods must be a subset of allowed_methods for each behavior.
  validation {
    condition = alltrue(flatten([
      for behavior in var.ordered_cache_behaviors : [
        for method in try(behavior.cached_methods, ["GET", "HEAD", "OPTIONS"]) :
        contains(try(behavior.allowed_methods, ["GET", "HEAD", "OPTIONS"]), method)
      ]
    ]))
    error_message = "Each ordered cache behavior cached_methods list must be a subset of its allowed_methods list."
  }

  # Lambda@Edge event types per ordered behavior must be valid.
  validation {
    condition = alltrue(flatten([
      for behavior in var.ordered_cache_behaviors : [
        for association in try(behavior.lambda_function_associations, []) :
        contains(["viewer-request", "origin-request", "viewer-response", "origin-response"], association.event_type)
      ]
    ]))
    error_message = "ordered_cache_behaviors.lambda_function_associations event_type must be viewer-request, origin-request, viewer-response, or origin-response."
  }

  # CloudFront Function event types per ordered behavior must be valid.
  validation {
    condition = alltrue(flatten([
      for behavior in var.ordered_cache_behaviors : [
        for association in try(behavior.function_associations, []) :
        contains(["viewer-request", "viewer-response"], association.event_type)
      ]
    ]))
    error_message = "ordered_cache_behaviors.function_associations event_type must be viewer-request or viewer-response."
  }
}

# custom_error_responses
# Optional list of custom error response mappings.
# Used to override what CloudFront returns when an origin responds with an
# HTTP error code (4xx or 5xx).
# Most common use: SPA routing — map 403/404 to 200 + /index.html so that
# client-side routes like "/dashboard" load the JS app rather than failing.
variable "custom_error_responses" {
  description = "Custom error responses applied to the distribution."

  type = list(object({
    # The HTTP status code from the ORIGIN that triggers this override. Range: 400–599.
    error_code = number
    # The HTTP status code CloudFront sends to the VIEWER. Example: 200 for SPA routing.
    response_code = optional(number)
    # The path of the object CloudFront returns to the viewer. Example: "/index.html".
    response_page_path = optional(string)
    # How long (seconds) this error response is cached. 0 = do not cache.
    error_caching_min_ttl = optional(number, 0)
  }))

  # Default: no custom error responses. Add them only when you need them.
  default = []

  # error_code must be a valid HTTP client or server error status code.
  validation {
    condition = alltrue([
      for response in var.custom_error_responses :
      response.error_code >= 400 && response.error_code <= 599
    ])
    error_message = "Each custom_error_responses.error_code must be between 400 and 599."
  }

  # response_code, when provided, must also be a valid HTTP status code.
  # try(..., null) handles the case where response_code is not set.
  validation {
    condition = alltrue([
      for response in var.custom_error_responses :
      try(response.response_code, null) == null || (response.response_code >= 200 && response.response_code <= 599)
    ])
    error_message = "Each custom_error_responses.response_code must be between 200 and 599 when set."
  }

  # error_caching_min_ttl cannot be negative.
  validation {
    condition = alltrue([
      for response in var.custom_error_responses :
      response.error_caching_min_ttl >= 0
    ])
    error_message = "Each custom_error_responses.error_caching_min_ttl value must be zero or greater."
  }
}

# ---------------------------------------------------------------------------
# Geographic restrictions
# ---------------------------------------------------------------------------

# geo_restriction
# Optional.  Controls which countries can access this distribution.
# Default: "none" (no restrictions, all countries allowed).
#
# restriction_type options:
#   "none"      — allow all countries
#   "whitelist" — allow ONLY the listed ISO 3166-1 alpha-2 country codes
#   "blacklist" — block the listed codes, allow everyone else
#
# Example whitelist for Indonesia and Singapore only:
#   { restriction_type = "whitelist", locations = ["ID", "SG"] }
variable "geo_restriction" {
  description = "Geo restriction settings for the distribution."

  type = object({
    restriction_type = optional(string, "none")
    # ISO 3166-1 alpha-2 country codes: ["SG", "ID", "US", "GB", ...]
    locations = optional(list(string), [])
  })

  default = {
    restriction_type = "none"
    locations        = []
  }

  # restriction_type must be one of the three valid values.
  validation {
    condition     = contains(["none", "blacklist", "whitelist"], try(var.geo_restriction.restriction_type, "none"))
    error_message = "geo_restriction.restriction_type must be none, blacklist, or whitelist."
  }

  # Enforce the relationship between restriction_type and locations:
  #   "none" requires an empty list.
  #   "blacklist" or "whitelist" requires at least one country code.
  # Using a blanket "none" with countries listed is a misconfiguration
  # because the list would be silently ignored by CloudFront.
  validation {
    condition = (
      try(var.geo_restriction.restriction_type, "none") == "none" && length(try(var.geo_restriction.locations, [])) == 0
      ) || (
      contains(["blacklist", "whitelist"], try(var.geo_restriction.restriction_type, "none")) && length(try(var.geo_restriction.locations, [])) > 0
    )
    error_message = "geo_restriction.locations must be empty when restriction_type is none, and non-empty for blacklist or whitelist."
  }
}

# ---------------------------------------------------------------------------
# Origin Access Control (OAC)
# ---------------------------------------------------------------------------

# origin_access_control
# Optional.  Configures how this module creates or reuses an OAC for S3 origins.
#
# Two usage patterns:
#   1. Let this module create an OAC (default: create = true):
#        origin_access_control = { create = true }
#
#   2. Bring your own pre-existing OAC:
#        origin_access_control = { create = false, id = "E1234567890ABC" }
variable "origin_access_control" {
  description = "CloudFront Origin Access Control settings for S3 origins."

  type = object({
    # When true, the module creates a new OAC resource.
    create = optional(bool, true)
    # When provided, the module uses this OAC ID instead of creating one.
    id = optional(string)
    # Optional display name. Auto-generated if not set.
    name = optional(string)
    # Description stored with the OAC in AWS.
    description      = optional(string, "Origin access control for CloudFront S3 origins.")
    # "always" = sign every request (recommended and most secure).
    signing_behavior = optional(string, "always")
    # "sigv4" is the only supported signing protocol for S3.
    signing_protocol = optional(string, "sigv4")
  })

  # Default: empty object — all fields use their own optional() defaults.
  # This means: create = true, signing_behavior = "always", etc.
  default = {}

  # signing_behavior must be one of the three allowed values.
  validation {
    condition     = contains(["always", "never", "no-override"], try(var.origin_access_control.signing_behavior, "always"))
    error_message = "origin_access_control.signing_behavior must be always, never, or no-override."
  }

  # signing_protocol must be "sigv4" (the only value CloudFront supports).
  validation {
    condition     = contains(["sigv4"], try(var.origin_access_control.signing_protocol, "sigv4"))
    error_message = "origin_access_control.signing_protocol must be sigv4."
  }

  # When any S3 origin exists, the caller must either bring their own OAC ID
  # or allow the module to create one.  Having neither would leave S3 origins
  # without authorisation, causing 403 Access Denied errors.
  validation {
    condition = length([
      for origin in values(var.origins) : origin
      if origin.origin_type == "s3"
    ]) == 0 || try(var.origin_access_control.id, null) != null || try(var.origin_access_control.create, true)
    error_message = "At least one of origin_access_control.id or origin_access_control.create = true is required when using S3 origins."
  }
}

# ---------------------------------------------------------------------------
# Custom domains and TLS certificates
# ---------------------------------------------------------------------------

# aliases
# Optional list of custom domain names (CNAMEs) for the distribution.
# Example: ["app.example.com", "www.example.com"]
# Requires a matching ACM certificate in us-east-1 (see acm_certificate_arn).
# Without aliases, the distribution is only reachable via *.cloudfront.net.
variable "aliases" {
  description = "Optional alternate domain names (CNAMEs) for the distribution."
  type        = list(string)
  default     = []

  # Aliases require a certificate. Without one, CloudFront would reject the
  # request because it cannot present a valid TLS cert for your custom domain.
  validation {
    condition     = length(var.aliases) == 0 || var.acm_certificate_arn != null
    error_message = "aliases require acm_certificate_arn to be set."
  }
}

# acm_certificate_arn
# Optional.  The ARN of an ACM TLS certificate for your custom domains.
# IMPORTANT: The certificate MUST be in the us-east-1 region.
# CloudFront is a global service and only reads certificates from us-east-1.
# Example: "arn:aws:acm:us-east-1:123456789012:certificate/abc-123"
variable "acm_certificate_arn" {
  description = "Optional ACM certificate ARN for custom domains. The certificate must be in us-east-1."
  type        = string
  default     = null

  # Enforce the us-east-1 requirement. strcontains() checks whether the
  # ARN string contains ":us-east-1:". A certificate in any other region
  # would cause a silent failure or a confusing AWS error during apply.
  validation {
    condition = (
      var.acm_certificate_arn == null ||
      strcontains(var.acm_certificate_arn, ":us-east-1:")
    )
    error_message = "CloudFront ACM certificates must be created in us-east-1."
  }
}

# ssl_support_method
# How CloudFront presents the TLS certificate to viewers.
#   "sni-only"  — uses Server Name Indication. Free, works with all modern
#                 browsers (2010+). Recommended for virtually all use cases.
#   "vip"       — dedicated IP addresses at each edge location. Very expensive.
#                 Only needed for very old clients that do not support SNI.
#   "static-ip" — similar to vip, for specific use cases requiring fixed IPs.
variable "ssl_support_method" {
  description = "SSL support method used when attaching a custom ACM certificate."
  type        = string
  default     = "sni-only"

  validation {
    condition     = contains(["sni-only", "vip", "static-ip"], var.ssl_support_method)
    error_message = "ssl_support_method must be sni-only, vip, or static-ip."
  }
}

# minimum_protocol_version
# The oldest TLS version CloudFront will accept from viewers.
# Default: "TLSv1.2_2021" — blocks TLS 1.0, 1.1, and weak ciphers.
# This is the AWS-recommended setting for new distributions.
# Only configurable when using a custom ACM certificate.
variable "minimum_protocol_version" {
  description = "Minimum TLS protocol version when using an ACM certificate."
  type        = string
  default     = "TLSv1.2_2021"

  # Must be one of the exact strings the CloudFront API accepts.
  # TLSv1.2_2021 gives you the best security; SSLv3 / TLSv1 are insecure legacies.
  validation {
    condition = contains([
      "SSLv3",
      "TLSv1",
      "TLSv1_2016",
      "TLSv1.1_2016",
      "TLSv1.2_2018",
      "TLSv1.2_2019",
      "TLSv1.2_2021"
    ], var.minimum_protocol_version)
    error_message = "minimum_protocol_version must be a valid CloudFront TLS policy value."
  }
}

# ---------------------------------------------------------------------------
# Edge location pricing
# ---------------------------------------------------------------------------

# price_class
# Controls which AWS edge locations serve this distribution, and therefore
# the per-request cost and global coverage.
#   PriceClass_100 — North America and Europe only. Cheapest.
#   PriceClass_200 — adds South America, Middle East, Africa.
#   PriceClass_All — every CloudFront edge worldwide. Most expensive but
#                    gives the lowest latency for global audiences.
variable "price_class" {
  description = "CloudFront price class."
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_100", "PriceClass_200", "PriceClass_All"], var.price_class)
    error_message = "price_class must be PriceClass_100, PriceClass_200, or PriceClass_All."
  }
}

# ---------------------------------------------------------------------------
# Content serving
# ---------------------------------------------------------------------------

# default_root_object
# The object CloudFront serves when the URL path is exactly "/" (root).
# "index.html" is the universal convention for static websites and SPAs.
# Must NOT start with "/".
variable "default_root_object" {
  description = "Default object returned when the request path is '/'."
  type        = string
  default     = "index.html"

  # Terraform startswith() returns true if the string starts with the prefix.
  # The ! inverts: the condition passes only when the string does NOT start with "/".
  validation {
    condition     = var.default_root_object == null || !startswith(var.default_root_object, "/")
    error_message = "default_root_object must not start with '/'."
  }
}

# ---------------------------------------------------------------------------
# Security — WAF
# ---------------------------------------------------------------------------

# web_acl_id
# Optional.  The ARN or ID of an AWS WAF Web ACL to attach.
# When set, CloudFront evaluates every request against the WAF rules before
# serving or forwarding it.  Use this to block bad bots, rate-limit abusive
# clients, or maintain an IP allowlist/blocklist.
variable "web_acl_id" {
  description = "Optional AWS WAF web ACL ID or ARN associated with the distribution."
  type        = string
  default     = null
}

# ---------------------------------------------------------------------------
# Access logging
# ---------------------------------------------------------------------------

# enable_logging
# Toggle CloudFront standard access logging.
# Default: false — you must explicitly opt in.
# When true, you must also provide log_bucket_domain_name.
variable "enable_logging" {
  description = "Enable CloudFront standard access logging."
  type        = bool
  default     = false

  # Prevent the user from enabling logging but forgetting to set the
  # destination bucket — that would cause an AWS API error during apply.
  validation {
    condition     = !var.enable_logging || var.log_bucket_domain_name != null
    error_message = "log_bucket_domain_name must be set when enable_logging is true."
  }
}

# log_bucket_domain_name
# The domain name of the S3 bucket that receives CloudFront logs.
# Must end in ".s3.amazonaws.com".
# Example: "my-logs-bucket.s3.amazonaws.com"
# Required when enable_logging = true; leave null (default) otherwise.
variable "log_bucket_domain_name" {
  description = "S3 bucket domain name that receives CloudFront standard access logs."
  type        = string
  default     = null
}

# log_include_cookies
# When true, access log entries include the Cookie request header value.
# Cookies may contain sensitive session tokens — only enable for debugging.
variable "log_include_cookies" {
  description = "Whether CloudFront access logs should include cookie information."
  type        = bool
  default     = false
}

# log_prefix
# Optional folder prefix for log objects in the S3 bucket.
# Example: "cloudfront/prod/" groups logs under that path.
# Trailing slash is conventional but not required.
variable "log_prefix" {
  description = "Prefix for CloudFront access log objects."
  type        = string
  default     = "cloudfront/"
}

# ---------------------------------------------------------------------------
# Tagging
# ---------------------------------------------------------------------------

# tags
# Key-value pairs applied to all taggable resources created by this module
# (the CloudFront distribution).
# Standard tags: Project, Environment, ManagedBy, CostCenter.
variable "tags" {
  description = "Tags applied to all taggable resources created by this module."
  type        = map(string)
  default     = {}
}
