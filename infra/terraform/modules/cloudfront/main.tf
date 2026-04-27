# ---------------------------------------------------------------------------
# main.tf
#
# This is the central file of the CloudFront module.  It defines:
#   1. local values that pre-compute names and filtered maps used throughout
#      the file (the locals{} block)
#   2. An optional CloudFront Origin Access Control (OAC) resource that
#      lets CloudFront authenticate to S3 without making the bucket public
#   3. The CloudFront distribution itself — the main globally-distributed
#      CDN resource
#   4. IAM policy documents that grant CloudFront read access to each S3
#      origin bucket while blocking all plain-HTTP access
#   5. S3 bucket policy attachments that apply those generated documents
#
# Reading order for beginners:
#   Read locals{} first — it sets up all the computed "variables" used below.
#   Then read aws_cloudfront_origin_access_control.this.
#   Then read aws_cloudfront_distribution.this.
#   Finally read the data + resource blocks at the bottom for S3 bucket policies.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# locals{}
#
# A locals{} block defines computed values that are used multiple times
# inside this file.  Think of them as private intermediate variables —
# they keep expressions short and readable, and they are calculated once
# rather than repeated everywhere.
#
# locals are NOT inputs from the caller — they are derived from inputs.
# ---------------------------------------------------------------------------
locals {
  # distribution_name
  # -----------------
  # Every CloudFront distribution in this module needs a consistent display
  # name for the comment and for the OAC resource name below it.
  #
  # coalesce() returns the FIRST non-null, non-empty value it receives.
  # Decision:
  #   • If the caller supplied var.distribution_name, use it as-is.
  #   • Otherwise, auto-generate a name like "kjl-dev-cloudfront".
  distribution_name = coalesce(var.distribution_name, "${var.project_name}-${var.environment}-cloudfront")

  # has_s3_origins
  # --------------
  # A simple true/false flag that answers: "does this distribution have at
  # least one S3-type origin?"
  #
  # How it works:
  #   values(var.origins) gives a list of every origin object.
  #   The for expression filters that list, keeping only entries whose
  #   origin_type equals "s3".
  #   length(...) > 0 turns the filtered list into a boolean — true when at
  #   least one S3 origin exists.
  #
  # Why we need this:
  #   S3 origins require an OAC; custom origins do not.  This flag guards
  #   several downstream decisions so we never create OAC resources or write
  #   bucket policies for distributions that have no S3 origins.
  has_s3_origins = length([
    for origin in values(var.origins) : origin
    if origin.origin_type == "s3"
  ]) > 0

  # create_origin_access_control
  # ----------------------------
  # Decides whether Terraform should CREATE a new OAC resource, or skip
  # creation because either no S3 origins exist or the caller already
  # provided an existing OAC ID.
  #
  # The && operator means ALL three conditions must be true:
  #   1. local.has_s3_origins        — at least one S3 origin exists
  #   2. ...id == null               — the caller did NOT pass a ready-made OAC ID
  #   3. ...create == true           — the caller has not explicitly disabled creation
  #
  # try(..., null) safely reads an optional field that may not be present in
  # var.origin_access_control.  If the field is absent, try() returns null
  # and the condition is evaluated accordingly.
  create_origin_access_control = local.has_s3_origins && try(var.origin_access_control.id, null) == null && try(var.origin_access_control.create, true)

  # origin_access_control_name
  # --------------------------
  # The name that will appear on the OAC resource in the AWS Console.
  # coalesce() prefers the caller-supplied name; if absent it auto-generates
  # one like "kjl-dev-cloudfront-oac".
  origin_access_control_name = coalesce(
    try(var.origin_access_control.name, null),
    "${local.distribution_name}-oac"
  )

  # origin_access_control_id
  # ------------------------
  # The actual OAC ID that CloudFront will reference for every S3 origin.
  # This is a ternary (if/else) expression:
  #
  #   Outer ternary: Does this distribution even have S3 origins?
  #     NO  → return null (no OAC needed at all)
  #     YES → pick the right OAC ID from one of two sources:
  #
  #       Inner ternary: Did the caller hand us a pre-existing OAC ID?
  #         YES → use var.origin_access_control.id directly
  #         NO  → use the ID of the OAC we just created above
  #
  # aws_cloudfront_origin_access_control.this[0].id reads the first (and
  # only) element of the count-based resource created below.
  origin_access_control_id = local.has_s3_origins ? (
    try(var.origin_access_control.id, null) != null
    ? var.origin_access_control.id
    : aws_cloudfront_origin_access_control.this[0].id
  ) : null

  # s3_origins
  # ----------
  # A filtered copy of var.origins containing ONLY the S3-type entries.
  # This is used wherever we need to iterate only over S3 origins (for
  # bucket name resolution and policy generation below).
  #
  # for expression syntax:
  #   for <key>, <value> in <map> : <new_key> => <new_value>  if <condition>
  #
  # origin_id becomes each.key in the resulting map.
  # origin becomes each.value.
  # The "if" clause keeps only entries where origin_type == "s3".
  s3_origins = {
    for origin_id, origin in var.origins :
    origin_id => origin
    if origin.origin_type == "s3"
  }

  # s3_origin_bucket_names
  # ----------------------
  # Maps each S3 origin ID to the physical AWS S3 bucket name.
  # We need bucket names separately from domain names because IAM policy
  # ARNs use bucket names, not domain names.
  #
  # coalesce() tries two sources in order:
  #   1. origin.s3_config.bucket_name — the caller explicitly provided a name.
  #   2. Derive the name from the domain name:
  #        "my-bucket.s3.ap-southeast-1.amazonaws.com" → split on ".s3" → "my-bucket"
  #      Only attempted when the domain name contains ".s3".
  #
  # try(..., null) safely reads the optional s3_config.bucket_name field.
  # strcontains() checks whether a string contains a substring.
  # split(".s3", ...)[0] grabs the part before ".s3" — the bucket name.
  s3_origin_bucket_names = {
    for origin_id, origin in local.s3_origins :
    origin_id => coalesce(
      try(origin.s3_config.bucket_name, null),
      strcontains(origin.domain_name, ".s3") ? split(".s3", origin.domain_name)[0] : null
    )
  }

  # s3_origin_bucket_policy_documents
  # ----------------------------------
  # Builds a deduplicated set of buckets that need an IAM policy document.
  # Multiple origins can point at the same underlying bucket, so we use
  # distinct() and compact() to generate only one policy per bucket.
  #
  # compact() removes any null values (buckets whose name could not be resolved).
  # distinct() removes duplicate bucket names.
  # values() flattens the map from s3_origin_bucket_names into a plain list.
  #
  # The resulting map has bucket names as keys and objects containing the
  # bucket ARN as values.  The ARN is built in the standard format:
  #   arn:aws:s3:::bucket-name
  # (S3 ARNs do not include a region or account ID.)
  s3_origin_bucket_policy_documents = {
    for bucket_name in distinct(compact(values(local.s3_origin_bucket_names))) :
    bucket_name => {
      bucket_arn = "arn:aws:s3:::${bucket_name}"
    }
  }

  # managed_s3_origin_bucket_policies
  # ----------------------------------
  # A further-filtered copy of s3_origin_bucket_policy_documents that keeps
  # only buckets where manage_bucket_policy = true (the default).
  #
  # Why this filter exists:
  #   Some buckets are shared resources managed by a separate Terraform module
  #   or by a different team.  Setting manage_bucket_policy = false on that
  #   origin tells this module: "I know about this bucket but do NOT touch
  #   its policy — another process handles it."
  #
  # How the filter works:
  #   The inner for expression builds a list of bucket names that have at
  #   least one S3 origin with manage_bucket_policy = true.
  #   contains() checks whether the current bucket_name is in that list.
  #   Only matching bucket names make it into the final map.
  managed_s3_origin_bucket_policies = {
    for bucket_name, config in local.s3_origin_bucket_policy_documents :
    bucket_name => config
    if contains([
      for origin_id, origin in local.s3_origins :
      local.s3_origin_bucket_names[origin_id]
      if try(origin.s3_config.manage_bucket_policy, true)
    ], bucket_name)
  }
}

# ---------------------------------------------------------------------------
# aws_cloudfront_origin_access_control.this
#
# What is OAC?
#   Origin Access Control is a CloudFront feature that lets CloudFront sign
#   every request it makes to an S3 bucket using AWS SigV4.  The bucket only
#   needs to allow the CloudFront service principal — no public URL is
#   required and no public access is needed.
#
# Why OAC instead of the older OAI (Origin Access Identity)?
#   OAC supports all S3 regions, server-side encryption with KMS, and POST/
#   PUT requests.  AWS recommends OAC for all new distributions.
#
# count = ... (conditional creation)
#   count is an integer: 0 means "create nothing", 1 means "create one".
#   local.create_origin_access_control is a boolean local defined above.
#   When it is true the ternary returns 1 and the resource is created.
#   When it is false the ternary returns 0 and the resource is skipped.
#   This is the standard Terraform pattern for optional singleton resources.
# ---------------------------------------------------------------------------
resource "aws_cloudfront_origin_access_control" "this" {
  # Create exactly one OAC when the conditions in locals are met.
  # If count = 0, no resource is created and no state is stored.
  count = local.create_origin_access_control ? 1 : 0

  # The name shown in the AWS Console for this OAC.
  # Comes from local.origin_access_control_name (computed in locals above).
  name = local.origin_access_control_name

  # A human-readable description stored with the OAC.
  # try(..., null) reads the optional description field safely.
  description = try(var.origin_access_control.description, null)

  # The type of origin this OAC is used with — always "s3" in this module.
  # CloudFront only supports "s3" here currently.
  origin_access_control_origin_type = "s3"

  # Controls when CloudFront signs requests:
  #   "always"      — sign every request (recommended, most secure)
  #   "never"       — never sign; the bucket must allow public access
  #   "no-override" — only sign if the origin configuration does not already
  #                   specify signing
  signing_behavior = try(var.origin_access_control.signing_behavior, "always")

  # The signing algorithm.  "sigv4" is the only value AWS supports for S3.
  signing_protocol = try(var.origin_access_control.signing_protocol, "sigv4")
}

# ---------------------------------------------------------------------------
# aws_cloudfront_distribution.this
#
# This is the main resource.  A CloudFront distribution is a globally
# distributed CDN endpoint that:
#   • Accepts requests from users around the world
#   • Serves cached content from the nearest AWS edge location
#   • Forwards cache misses to one or more "origins" (S3, API, ALB, etc.)
#   • Enforces TLS, geo-restrictions, and WAF rules
#
# A distribution can have many origins and many cache behaviors.  The
# "default_cache_behavior" handles requests that do not match any
# "ordered_cache_behavior" path pattern.
# ---------------------------------------------------------------------------
resource "aws_cloudfront_distribution" "this" {
  # Whether the distribution is actively serving traffic.
  # Set to false to pause the distribution without deleting it.
  enabled = var.enabled

  # Enables IPv6 support on the distribution's domain names.
  # Most modern clients support IPv6; enabling this is a safe default.
  is_ipv6_enabled = var.is_ipv6_enabled

  # When true, Terraform waits for the distribution to reach "Deployed"
  # status before marking the apply as complete.  This can take 5-15 minutes
  # but prevents downstream resources from referencing a distribution that
  # is not yet serving traffic.
  wait_for_deployment = var.wait_for_deployment

  # The object CloudFront returns when a request comes in for "/" with no
  # path.  "index.html" is standard for static websites and SPAs.
  default_root_object = var.default_root_object

  # A short label shown in the CloudFront console list.
  # coalesce() returns the caller-supplied comment, or falls back to the
  # auto-generated distribution_name local.
  comment = coalesce(var.comment, local.distribution_name)

  # Alternate domain names (CNAMEs) for this distribution.
  # Example: ["app.example.com", "www.example.com"]
  # These require an ACM certificate in us-east-1 (see viewer_certificate below).
  aliases = var.aliases

  # Controls which global edge locations serve this distribution.
  # PriceClass_100 = North America + Europe (cheapest, lowest latency for those regions)
  # PriceClass_200 = adds South America, Middle East, Africa
  # PriceClass_All = all edge locations worldwide (most expensive)
  price_class = var.price_class

  # The maximum HTTP version CloudFront negotiates with viewers.
  # "http2and3" supports both HTTP/2 and HTTP/3 (QUIC), which reduces
  # latency for modern browsers.
  http_version = var.http_version

  # Optional AWS WAF Web ACL ID.  When set, CloudFront evaluates every
  # incoming request against the WAF rules before serving or forwarding it.
  # Useful for blocking bots, rate-limiting, and IP allow/deny lists.
  web_acl_id = var.web_acl_id

  # When true, Terraform disables the distribution instead of deleting it
  # when you run "terraform destroy".  This protects against accidental
  # full deletion in production — you would need to manually delete it.
  retain_on_delete = var.retain_on_delete

  # Optional: links this distribution to a CloudFront continuous deployment
  # policy for blue/green or weighted traffic shifting between distributions.
  continuous_deployment_policy_id = var.continuous_deployment_policy_id

  # ---------------------------------------------------------------------------
  # dynamic "origin" block
  #
  # A "dynamic" block generates zero or more nested configuration blocks at
  # plan/apply time.  Without dynamic blocks you would need to write one
  # static "origin" block per CloudFront origin, which is impossible when
  # the number of origins is determined by the caller at runtime.
  #
  # How dynamic works:
  #   for_each = var.origins  → iterate over every entry in the origins map
  #   Each iteration creates one "origin" block.
  #   Inside the content{} block:
  #     origin.key   = the map key (the CloudFront origin ID, e.g. "frontend")
  #     origin.value = the full origin object (domain_name, origin_type, etc.)
  # ---------------------------------------------------------------------------
  dynamic "origin" {
    # Iterate over every entry in var.origins.
    # Each map entry becomes one CloudFront origin configuration block.
    for_each = var.origins

    content {
      # The DNS name CloudFront uses when forwarding requests to this origin.
      # For S3: "my-bucket.s3.ap-southeast-1.amazonaws.com"
      # For custom: "api.example.com"
      domain_name = origin.value.domain_name

      # The unique identifier for this origin within the distribution.
      # This is the map key (e.g. "frontend", "api").
      # Cache behaviors reference origins by this ID.
      origin_id = origin.key

      # An optional subpath that CloudFront prepends to all requests sent
      # to this origin.  Example: "/v1" means CloudFront forwards
      # "/api/users" to the origin as "/v1/api/users".
      origin_path = try(origin.value.origin_path, null)

      # How many times CloudFront retries a failed connection attempt.
      # Range: 1–3.  Default: 3.
      connection_attempts = try(origin.value.connection_attempts, 3)

      # Seconds CloudFront waits for a TCP connection before giving up.
      # Range: 1–10.  Default: 10.
      connection_timeout = try(origin.value.connection_timeout, 10)

      # Attach the OAC ID to S3 origins so CloudFront signs requests.
      # For custom origins this is always null — they do not use OAC.
      # The ternary reads: "if this is an S3 origin, use the OAC ID; else null".
      origin_access_control_id = origin.value.origin_type == "s3" ? local.origin_access_control_id : null

      # -----------------------------------------------------------------------
      # dynamic "custom_header"
      # Adds extra HTTP headers to every request CloudFront sends to this
      # origin.  Common uses: pass a secret token to verify traffic came from
      # CloudFront, or add a correlation header.
      #
      # for_each = try(origin.value.custom_headers, {})
      #   Iterates over the map of header name → header value.
      #   try(..., {}) returns an empty map if custom_headers was not set,
      #   which means zero custom_header blocks are generated (no headers added).
      # -----------------------------------------------------------------------
      dynamic "custom_header" {
        # Iterate over each key-value pair in the custom_headers map.
        # If custom_headers is absent or empty, no blocks are generated.
        for_each = try(origin.value.custom_headers, {})

        content {
          # custom_header.key   = the header name  (e.g. "X-Custom-Token")
          # custom_header.value = the header value (e.g. "supersecret")
          name  = custom_header.key
          value = custom_header.value
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "custom_origin_config"
      # Required for non-S3 origins (ALB, API Gateway, plain HTTPS servers).
      # Tells CloudFront how to connect to the origin server: which ports,
      # which protocol, and which TLS versions to accept.
      #
      # for_each condition:
      #   origin_type == "custom"  → generate one block with merged defaults
      #   origin_type == "s3"      → for_each = [] (empty), no block created
      #
      # merge() combines two maps: the hard-coded safe defaults on the left
      # are overridden by any caller-supplied values on the right.  This
      # means a caller who sets only origin_protocol_policy gets all other
      # fields from the defaults automatically.
      # -----------------------------------------------------------------------
      dynamic "custom_origin_config" {
        # Only generate this block for custom (non-S3) origins.
        # merge() applies caller overrides on top of safe defaults.
        for_each = origin.value.origin_type == "custom" ? [merge(
          {
            # Default: accept connections on port 80 (HTTP) from CloudFront.
            # Most origins also listen on 443; this is a required field.
            http_port = 80
            # Default: accept connections on port 443 (HTTPS).
            https_port = 443
            # Default: CloudFront connects to the origin using HTTPS only.
            # "https-only" is the most secure choice and strongly recommended.
            origin_protocol_policy = "https-only"
            # Default: only TLS 1.2 or newer is allowed for the CloudFront →
            # origin connection.  Older versions have known vulnerabilities.
            origin_ssl_protocols = ["TLSv1.2"]
            # Seconds CloudFront keeps idle connections to the origin open.
            # Reusing connections reduces latency.  Range: 1–60.
            origin_keepalive_timeout = 5
            # Seconds CloudFront waits for the origin to respond.
            # Increase this for slow-starting apps.  Range: 1–60.
            origin_read_timeout = 30
          },
          # Caller-supplied values override defaults when the key matches.
          try(origin.value.custom_origin_config, {})
        )] : []

        content {
          # These fields come from the merged object above.
          http_port                = custom_origin_config.value.http_port
          https_port               = custom_origin_config.value.https_port
          origin_protocol_policy   = custom_origin_config.value.origin_protocol_policy
          origin_ssl_protocols     = custom_origin_config.value.origin_ssl_protocols
          origin_keepalive_timeout = custom_origin_config.value.origin_keepalive_timeout
          origin_read_timeout      = custom_origin_config.value.origin_read_timeout
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "s3_origin_config"
      # Used for S3 origins only when OAC is not attached.
      #
      # Historically this block held an Origin Access Identity string.
      # When OAC is in use, rendering an empty s3_origin_config can create
      # provider normalization drift in some AWS provider versions.
      #
      # for_each = [1] creates one block; for_each = [] creates none.
      # The ternary chooses which list to pass.
      # -----------------------------------------------------------------------
      dynamic "s3_origin_config" {
        # Render only when the origin is S3 and OAC is not attached.
        # [1] is a one-element list — it forces exactly one block to appear.
        for_each = origin.value.origin_type == "s3" && local.origin_access_control_id == null ? [1] : []

        content {
          # Empty string: OAC is used instead of the legacy OAI string.
          # This field must be present but is intentionally blank.
          origin_access_identity = ""
        }
      }

      # -----------------------------------------------------------------------
      # dynamic "origin_shield"
      # Origin Shield is an optional extra caching layer that sits between
      # CloudFront edge locations and the origin.  It reduces the number of
      # requests that reach the origin by consolidating cache misses from
      # multiple edge locations into one.
      #
      # for_each condition:
      #   try(origin.value.origin_shield.enabled, false) == true
      #     → generate one block using the origin_shield object
      #   false (default, or field absent)
      #     → for_each = [] (empty), no block created
      # -----------------------------------------------------------------------
      dynamic "origin_shield" {
        # Only activate Origin Shield when the caller explicitly enables it.
        # try(..., false) defaults to false if origin_shield block is absent.
        for_each = try(origin.value.origin_shield.enabled, false) ? [origin.value.origin_shield] : []

        content {
          # Hardcoded true because we only generate this block when enabled = true.
          enabled = true
          # The AWS region where Origin Shield is deployed.
          # Choose the region closest to where your origin server is located.
          origin_shield_region = origin_shield.value.origin_shield_region
        }
      }
    }
  }

  # ---------------------------------------------------------------------------
  # default_cache_behavior
  #
  # This block defines how CloudFront handles requests that do NOT match any
  # ordered_cache_behavior path pattern.  It is the fallback behavior and is
  # required — every distribution must have exactly one.
  #
  # "Cache behavior" means: which origin to forward to, which HTTP methods
  # to accept, which caching policy to apply, and what TLS requirements to
  # enforce between viewer and CloudFront.
  # ---------------------------------------------------------------------------
  default_cache_behavior {
    # The origin ID that CloudFront forwards requests to for this behavior.
    # Must match one of the origin.key values in the dynamic "origin" block.
    target_origin_id = var.default_cache_behavior.target_origin_id

    # What CloudFront does when a viewer makes a plain HTTP request:
    #   "redirect-to-https" — send a 301 redirect to the HTTPS version
    #   "https-only"        — block HTTP entirely with a 403
    #   "allow-all"         — allow both HTTP and HTTPS (not recommended)
    viewer_protocol_policy = var.default_cache_behavior.viewer_protocol_policy

    # HTTP methods CloudFront accepts from viewers for this behavior.
    # ["GET", "HEAD", "OPTIONS"] is correct for read-only content (images, JS).
    # Add PUT/POST/DELETE/PATCH for API or upload endpoints.
    allowed_methods = var.default_cache_behavior.allowed_methods

    # HTTP methods that CloudFront caches responses for.
    # Must be a subset of allowed_methods.
    # Caching GET and HEAD responses is standard; OPTIONS is optional.
    cached_methods = var.default_cache_behavior.cached_methods

    # When true, CloudFront compresses text-based responses (HTML, CSS, JS)
    # with gzip or Brotli before sending them to the viewer.  This reduces
    # data transfer and improves page load times.
    compress = var.default_cache_behavior.compress

    # The ID of an AWS-managed or custom CloudFront Cache Policy.
    # Cache policies control TTL, cache keys (headers, cookies, query strings).
    # The default ID here is the "CachingOptimized" managed policy.
    cache_policy_id = var.default_cache_behavior.cache_policy_id

    # The ID of an Origin Request Policy that controls which headers,
    # cookies, and query strings CloudFront includes when forwarding
    # requests to the origin.  null = forward only what is in the cache key.
    origin_request_policy_id = var.default_cache_behavior.origin_request_policy_id

    # The ID of a Response Headers Policy that adds security headers
    # (Content-Security-Policy, HSTS, X-Frame-Options, etc.) to every
    # response CloudFront sends to the viewer.
    response_headers_policy_id = var.default_cache_behavior.response_headers_policy_id

    # Optional: ARN of a real-time log configuration (Kinesis Data Streams).
    # Use this for high-volume, low-latency access log streaming.
    realtime_log_config_arn = var.default_cache_behavior.realtime_log_config_arn

    # When true, CloudFront uses smooth streaming protocols for live video.
    # Only needed for Microsoft Smooth Streaming media; false for most uses.
    smooth_streaming = var.default_cache_behavior.smooth_streaming

    # Optional: ID of a CloudFront field-level encryption profile.
    # Used to encrypt specific fields in POST bodies for HIPAA/PCI compliance.
    field_level_encryption_id = var.default_cache_behavior.field_level_encryption_id

    # Optional: list of CloudFront Key Group IDs for signed URL/cookie validation.
    # Use this to restrict content delivery to authenticated viewers only.
    trusted_key_groups = var.default_cache_behavior.trusted_key_groups

    # Deprecated alternative to trusted_key_groups (uses AWS account IDs).
    # Keep as empty list []; prefer trusted_key_groups for new code.
    trusted_signers = var.default_cache_behavior.trusted_signers

    # -------------------------------------------------------------------------
    # dynamic "lambda_function_association"
    # Attaches Lambda@Edge functions to this cache behavior.
    # Lambda@Edge lets you run Node.js or Python code at CloudFront edge
    # locations — for tasks like A/B testing, URL rewriting, auth header
    # injection, and request manipulation.
    #
    # for_each iterates over the list of associations.
    # An empty list (the default) means no blocks are generated.
    # -------------------------------------------------------------------------
    dynamic "lambda_function_association" {
      # For each Lambda@Edge association in the list, generate one block.
      # Default is an empty list, producing no blocks.
      for_each = var.default_cache_behavior.lambda_function_associations

      content {
        # The CloudFront event that triggers this Lambda function:
        #   "viewer-request"  — before CloudFront checks the cache
        #   "origin-request"  — on a cache miss, before forwarding to origin
        #   "origin-response" — after the origin responds, before caching
        #   "viewer-response" — before sending the response to the viewer
        event_type = lambda_function_association.value.event_type

        # The deployed Lambda function ARN (must include version, not $LATEST).
        lambda_arn = lambda_function_association.value.lambda_arn

        # When true, CloudFront passes the request body to the Lambda function.
        # Only meaningful for viewer-request and origin-request events.
        include_body = try(lambda_function_association.value.include_body, false)
      }
    }

    # -------------------------------------------------------------------------
    # dynamic "function_association"
    # Attaches CloudFront Functions (lightweight JS code) to this behavior.
    # CloudFront Functions run at ~1/6 the cost of Lambda@Edge but only
    # support viewer-request and viewer-response events, and have smaller
    # execution limits.
    # -------------------------------------------------------------------------
    dynamic "function_association" {
      # For each CloudFront Function association, generate one block.
      for_each = var.default_cache_behavior.function_associations

      content {
        # Only "viewer-request" and "viewer-response" are valid for
        # CloudFront Functions (Lambda@Edge supports all four events).
        event_type = function_association.value.event_type
        # The ARN of the CloudFront Function to invoke.
        function_arn = function_association.value.function_arn
      }
    }
  }

  # ---------------------------------------------------------------------------
  # dynamic "ordered_cache_behavior"
  # Additional cache behaviors evaluated BEFORE the default behavior.
  # CloudFront checks each ordered behavior's path_pattern against the
  # request path in the order listed.  The first match wins.
  # If no ordered behavior matches, the default_cache_behavior is used.
  #
  # Common use case: route "/api/*" to an API origin and serve everything
  # else from S3.
  #
  # for_each = var.ordered_cache_behaviors
  #   Iterates over the list of behavior objects.
  #   Default is an empty list, creating no ordered behaviors.
  #   ordered_cache_behavior.value = one behavior object from the list.
  # ---------------------------------------------------------------------------
  dynamic "ordered_cache_behavior" {
    # Iterate over each item in the ordered_cache_behaviors list.
    # The list index becomes the iteration key (0, 1, 2, …).
    for_each = var.ordered_cache_behaviors

    content {
      # The URL path pattern this behavior applies to.
      # Example: "/api/*" matches all paths starting with "/api/".
      # CloudFront tests patterns in order; use the most specific first.
      path_pattern = ordered_cache_behavior.value.path_pattern

      # Which origin to send matched requests to.
      # Must match an origin_id from the dynamic "origin" block.
      target_origin_id = ordered_cache_behavior.value.target_origin_id

      # Same semantics as in default_cache_behavior above.
      viewer_protocol_policy     = ordered_cache_behavior.value.viewer_protocol_policy
      allowed_methods            = ordered_cache_behavior.value.allowed_methods
      cached_methods             = ordered_cache_behavior.value.cached_methods
      compress                   = ordered_cache_behavior.value.compress
      cache_policy_id            = ordered_cache_behavior.value.cache_policy_id
      origin_request_policy_id   = ordered_cache_behavior.value.origin_request_policy_id
      response_headers_policy_id = ordered_cache_behavior.value.response_headers_policy_id
      realtime_log_config_arn    = ordered_cache_behavior.value.realtime_log_config_arn
      smooth_streaming           = ordered_cache_behavior.value.smooth_streaming
      field_level_encryption_id  = ordered_cache_behavior.value.field_level_encryption_id
      trusted_key_groups         = ordered_cache_behavior.value.trusted_key_groups
      trusted_signers            = ordered_cache_behavior.value.trusted_signers

      # Same Lambda@Edge association logic as in default_cache_behavior.
      dynamic "lambda_function_association" {
        for_each = ordered_cache_behavior.value.lambda_function_associations

        content {
          event_type   = lambda_function_association.value.event_type
          lambda_arn   = lambda_function_association.value.lambda_arn
          include_body = try(lambda_function_association.value.include_body, false)
        }
      }

      # Same CloudFront Function association logic as in default_cache_behavior.
      dynamic "function_association" {
        for_each = ordered_cache_behavior.value.function_associations

        content {
          event_type   = function_association.value.event_type
          function_arn = function_association.value.function_arn
        }
      }
    }
  }

  # ---------------------------------------------------------------------------
  # dynamic "custom_error_response"
  # Overrides what CloudFront returns to the viewer when the origin responds
  # with a specific HTTP error code.
  #
  # Common SPA use case:
  #   When S3 returns 403 (key not found), return 200 with index.html instead.
  #   This allows client-side routing (React Router, Vue Router) to work —
  #   a deep link like "/dashboard/settings" is handled by the JS app, not
  #   by a matching S3 object.
  #
  # for_each = var.custom_error_responses
  #   Default is [], so no custom error responses are configured unless
  #   the caller explicitly provides them.
  # ---------------------------------------------------------------------------
  dynamic "custom_error_response" {
    # Generate one block for each custom error response in the list.
    for_each = var.custom_error_responses

    content {
      # The HTTP status code from the origin that triggers this override.
      # Valid range: 400–599.  Common values: 403, 404, 500, 503.
      error_code = custom_error_response.value.error_code

      # The HTTP status code CloudFront sends to the viewer instead.
      # Example: set to 200 so SPAs receive a 200 with the index page.
      response_code = custom_error_response.value.response_code

      # The path of the object CloudFront returns to the viewer.
      # Must be a path relative to the distribution root.
      # Example: "/index.html" for an SPA.
      response_page_path = custom_error_response.value.response_page_path

      # How long (seconds) CloudFront caches this error response.
      # Setting to 0 means the next request immediately retries the origin.
      # Use a short cache time for transient errors (500, 503) and a longer
      # one for permanent redirects (404 → index.html for SPAs).
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
    }
  }

  # ---------------------------------------------------------------------------
  # restrictions → geo_restriction
  # Controls which countries can or cannot access this distribution.
  # ---------------------------------------------------------------------------
  restrictions {
    geo_restriction {
      # The type of restriction:
      #   "none"      — allow all countries (default)
      #   "whitelist" — allow ONLY the listed countries
      #   "blacklist" — block the listed countries, allow all others
      restriction_type = var.geo_restriction.restriction_type

      # ISO 3166-1 alpha-2 country codes (e.g. ["US", "SG", "ID"]).
      # When restriction_type is "none", this must be an empty list.
      # The ternary enforces that rule: if "none", always pass [].
      locations = var.geo_restriction.restriction_type == "none" ? [] : var.geo_restriction.locations
    }
  }

  # ---------------------------------------------------------------------------
  # viewer_certificate
  # Configures the TLS certificate presented to viewers (browsers/clients).
  # This module requires a custom ACM certificate in us-east-1.
  # ---------------------------------------------------------------------------
  viewer_certificate {
    # The ARN of the ACM certificate in us-east-1.
    acm_certificate_arn = var.acm_certificate_arn

    # How CloudFront serves HTTPS: "sni-only" uses SNI (free, modern browsers).
    # "vip" uses a dedicated IP per edge location (high cost, legacy clients).
    ssl_support_method = var.ssl_support_method

    # Enforce a fixed secure TLS policy for all viewer connections.
    # This is intentionally hardcoded to satisfy strict SAST checks.
    minimum_protocol_version = "TLSv1.2_2021"

    # Always false because this module requires a custom ACM certificate.
    cloudfront_default_certificate = false
  }

  # ---------------------------------------------------------------------------
  # dynamic "logging_config"
  # Enables CloudFront standard access logging to an S3 bucket.
  # Every HTTP request processed by CloudFront is written as a compressed
  # log file to the specified bucket.
  #
  # for_each condition:
  #   var.enable_logging == true  → for_each = [1] → one block created
  #   var.enable_logging == false → for_each = []  → no block created (default)
  #
  # The logging bucket must have "BucketOwnerPreferred" ACL ownership mode
  # and must allow CloudFront's log delivery service to write objects.
  # ---------------------------------------------------------------------------
  dynamic "logging_config" {
    # [1] is a one-element list; it generates exactly one logging_config block.
    # An empty list [] generates none.
    for_each = var.enable_logging ? [1] : []

    content {
      # The domain name of the S3 bucket that receives the logs.
      # Must end in ".s3.amazonaws.com", e.g. "my-logs.s3.amazonaws.com".
      bucket = var.log_bucket_domain_name

      # When true, log entries include Cookie header values.
      # Only enable this if you need to debug cookie-based routing.
      # Cookie data can be sensitive (session tokens, tracking IDs).
      include_cookies = var.log_include_cookies

      # Optional prefix for log object keys inside the bucket.
      # Example: "cloudfront/prod/" groups logs under that folder path.
      prefix = var.log_prefix
    }
  }

  # Resource-level tags applied to the CloudFront distribution in AWS.
  # These appear in the AWS Console, Cost Explorer, and billing reports.
  tags = var.tags
}

# ---------------------------------------------------------------------------
# data "aws_iam_policy_document" "s3_origin_bucket_policy"
#
# A "data source" reads existing AWS information without creating anything.
# This data source generates IAM policy JSON — it does NOT create or attach
# any resource.  The JSON is consumed by aws_s3_bucket_policy.origin below.
#
# Why two statements?
#   1. AllowCloudFrontServicePrincipalReadOnly — grants CloudFront read access
#   2. DenyInsecureTransport — blocks all requests that are not using HTTPS
#
# for_each = local.s3_origin_bucket_policy_documents
#   Creates one policy document per unique S3 bucket.
#   each.key   = the bucket name (e.g. "kjl-prod-frontend")
#   each.value = { bucket_arn = "arn:aws:s3:::kjl-prod-frontend" }
# ---------------------------------------------------------------------------
data "aws_iam_policy_document" "s3_origin_bucket_policy" {
  # Generates one policy document per S3 bucket that needs a policy.
  # each.key   = the bucket name used later to attach the policy
  # each.value = the computed ARN object for that bucket
  for_each = local.s3_origin_bucket_policy_documents

  # ---------------------------------------------------------------------------
  # Statement 1: Allow CloudFront to read objects
  # ---------------------------------------------------------------------------
  statement {
    # A human-readable label shown in CloudTrail logs and the IAM console.
    sid = "AllowCloudFrontServicePrincipalReadOnly"
    # "Allow" — this statement grants access.
    effect = "Allow"

    # The entity being granted access.
    # "Service" principal with "cloudfront.amazonaws.com" means:
    # "allow the CloudFront service itself to make these API calls".
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    # Grant only s3:GetObject — the minimal read permission needed.
    # CloudFront only needs to read objects; it should never write or delete.
    actions = ["s3:GetObject"]

    # Apply to every object inside the bucket (trailing /*).
    # The bucket ARN alone would only cover the bucket itself, not its objects.
    resources = ["${each.value.bucket_arn}/*"]

    # A safety condition: only allow requests that come from THIS specific
    # CloudFront distribution.  Without this, ANY CloudFront distribution
    # (even one owned by another account) could read from your bucket.
    # AWS:SourceArn must exactly match the distribution's ARN.
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      # Reference the distribution ARN from the resource created above.
      # This creates a dependency: Terraform creates the distribution first,
      # then generates this policy document with the real ARN.
      values = [aws_cloudfront_distribution.this.arn]
    }
  }

  # Allow CloudFront to list the bucket. Some access patterns rely on this
  # in addition to object-level reads.
  statement {
    sid    = "AllowCloudFrontServicePrincipalListBucket"
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    actions = ["s3:ListBucket"]

    resources = [each.value.bucket_arn]

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.this.arn]
    }
  }

  # ---------------------------------------------------------------------------
  # Statement 2: Deny plain-HTTP (non-HTTPS) requests to the bucket
  # ---------------------------------------------------------------------------
  statement {
    # Human-readable label for audit logs.
    sid = "DenyInsecureTransport"
    # "Deny" — this statement BLOCKS access.
    # In IAM, Deny always wins over Allow, regardless of other statements.
    effect = "Deny"

    # s3:* — this deny applies to ALL S3 actions.
    # Only requests failing the SecureTransport condition are actually denied.
    actions = ["s3:*"]

    # Apply to both the bucket itself and all objects inside it.
    # The bucket ARN covers bucket-level actions (s3:ListBucket).
    # The //* ARN covers object-level actions (s3:GetObject, s3:PutObject).
    resources = [
      each.value.bucket_arn,
      "${each.value.bucket_arn}/*"
    ]

    # Apply to everyone ("*" principal = any AWS identity, any service,
    # any anonymous user).  This makes it a blanket enforcement rule.
    principals {
      type        = "*"
      identifiers = ["*"]
    }

    # Trigger the Deny when aws:SecureTransport = "false".
    # aws:SecureTransport is "true" for HTTPS requests and "false" for HTTP.
    # So this condition fires only on plain-HTTP requests → they are denied.
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

# ---------------------------------------------------------------------------
# aws_s3_bucket_policy.origin
#
# Attaches the IAM policy document generated above to the actual S3 bucket.
# Without this resource, the policy JSON is computed but never applied—the
# bucket would remain unprotected.
#
# for_each = local.managed_s3_origin_bucket_policies
#   Creates one bucket policy per bucket that has manage_bucket_policy = true.
#   each.key = the bucket name — used as the bucket identifier and as the
#              lookup key into the policy document map above.
# ---------------------------------------------------------------------------
resource "aws_s3_bucket_policy" "origin" {
  # Create one bucket policy per managed S3 origin bucket.
  # each.key = bucket name (e.g. "kjl-prod-frontend")
  for_each = local.managed_s3_origin_bucket_policies

  # The name of the S3 bucket to attach the policy to.
  # each.key is the bucket name resolved in local.s3_origin_bucket_names.
  bucket = each.key

  # The JSON policy document.  We look up the pre-generated document using
  # the same each.key (bucket name) as the index.
  policy = data.aws_iam_policy_document.s3_origin_bucket_policy[each.key].json
}
