# This file defines the public input contract for the module.
# A beginner can read this file to understand what values the module accepts,
# which values are optional, and what safety checks are enforced before apply.

# Provide one shared hosted zone ID for the common case where many records live
# in the same Route53 zone.
# This makes the module easier to reuse because callers do not need to repeat
# the same zone_id on every record.
variable "default_zone_id" {
  # This description appears in Terraform documentation tools and helps users
  # understand when this variable should be set.
  description = "Optional default Route53 hosted zone ID applied to records that do not define zone_id explicitly."

  # The value must be a string because Route53 zone IDs are text values.
  type = string

  # A null default means callers may omit this variable.
  # When omitted, every record must supply its own zone_id.
  default = null

  # Allow null so the variable can be intentionally left unset.
  nullable = true

  # Validate the format early so users get a clear error before Terraform tries
  # to call the AWS API.
  validation {
    # Accept null, or accept a string that looks like a Route53 hosted zone ID.
    condition = var.default_zone_id == null || can(regex("^Z[A-Z0-9]+$", trimspace(var.default_zone_id)))

    # Explain the validation failure in beginner-friendly language.
    error_message = "default_zone_id must be null or a valid Route53 hosted zone ID."
  }
}

# Define optional managed Route53 health checks.
# These health checks can be created inside the module and then referenced by
# DNS records through logical keys instead of hard-coded AWS IDs.
variable "health_checks" {
  # Describe the purpose of the map and how records will consume it.
  description = "Optional map of Route53 health checks keyed by a stable logical name. Records can reference these entries through health_check_key."

  # Use a map(object(...)) so callers can define multiple health checks in a
  # reusable way.
  # The map key becomes a stable logical name, while the object holds the
  # actual health check configuration.
  type = map(object({
    # Select the kind of health check Route53 should create.
    # This controls which other settings are relevant.
    type = string

    # Optionally add a friendly name that makes the health check easier to
    # identify in AWS.
    reference_name = optional(string)

    # For endpoint checks, this is the DNS name Route53 checks.
    fqdn = optional(string)

    # For endpoint checks, this can be the direct IP address Route53 checks.
    ip_address = optional(string)

    # For endpoint checks, this controls which network port Route53 probes.
    port = optional(number)

    # For HTTP and HTTPS checks, this is the URL path Route53 requests.
    resource_path = optional(string)

    # For string match checks, this text must appear in the response body.
    search_string = optional(string)

    # This controls how many failures are needed before Route53 marks the
    # target unhealthy.
    failure_threshold = optional(number)

    # This controls how frequently Route53 sends a new health check request.
    request_interval = optional(number)

    # When true, Route53 measures latency in addition to health.
    measure_latency = optional(bool, false)

    # When true, Route53 flips healthy to unhealthy and unhealthy to healthy.
    invert_healthcheck = optional(bool, false)

    # When true, Route53 stops actively checking the target.
    disabled = optional(bool, false)

    # For HTTPS-based checks, this controls whether Route53 sends the hostname
    # using SNI during the TLS handshake.
    enable_sni = optional(bool)

    # For calculated checks, this lets callers supply existing child health
    # check IDs directly.
    child_healthchecks = optional(list(string), [])

    # For calculated checks, this lets callers reference other health checks
    # created by this same module using logical keys.
    child_health_check_keys = optional(list(string), [])

    # For calculated checks, this sets how many healthy child checks are needed
    # before the parent is considered healthy.
    child_health_threshold = optional(number)

    # For CloudWatch alarm-based checks, this block identifies the alarm.
    cloudwatch_alarm = optional(object({
      # This is the CloudWatch alarm name Route53 watches.
      name = string

      # This is the AWS region where that alarm exists.
      region = string
    }))

    # For CloudWatch alarm-based checks, this controls what Route53 should do
    # when CloudWatch reports insufficient data.
    insufficient_data_health_status = optional(string)

    # Optionally limit which Route53 checker regions perform endpoint probes.
    regions = optional(list(string), [])

    # For recovery control checks, this points to the routing control ARN.
    routing_control_arn = optional(string)

    # For CloudWatch alarm checks, this map can force updates when upstream
    # alarm settings change.
    triggers = optional(map(string), {})

    # Apply tags to health checks for cost allocation and operations visibility.
    tags = optional(map(string), {})
  }))

  # Use an empty map by default so callers can use the module for records only.
  default = {}

  # Ensure every logical key is a usable non-empty name.
  validation {
    condition     = alltrue([for key in keys(var.health_checks) : length(trimspace(key)) > 0])
    error_message = "health_checks keys must be non-empty strings."
  }

  # Ensure users pick a supported Route53 health check type.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : contains([
        "HTTP",
        "HTTPS",
        "HTTP_STR_MATCH",
        "HTTPS_STR_MATCH",
        "TCP",
        "CALCULATED",
        "CLOUDWATCH_METRIC",
        "RECOVERY_CONTROL"
      ], upper(trimspace(health_check.type)))
    ])
    error_message = "Each health check must use a supported Route53 health check type."
  }

  # Endpoint checks need something concrete to probe.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : !contains([
        "HTTP",
        "HTTPS",
        "HTTP_STR_MATCH",
        "HTTPS_STR_MATCH",
        "TCP"
      ], upper(trimspace(health_check.type))) || (
        try(length(trimspace(health_check.fqdn)), 0) > 0 ||
        try(length(trimspace(health_check.ip_address)), 0) > 0
      )
    ])
    error_message = "Endpoint health checks must define at least one of fqdn or ip_address."
  }

  # TCP checks are meaningless without a valid port number.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : upper(trimspace(health_check.type)) != "TCP" || (
        try(health_check.port, 0) >= 1 &&
        try(health_check.port, 65536) <= 65535
      )
    ])
    error_message = "TCP health checks must define port between 1 and 65535."
  }

  # HTTP paths should look like URL paths so Route53 sends valid requests.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : !contains([
        "HTTP",
        "HTTPS",
        "HTTP_STR_MATCH",
        "HTTPS_STR_MATCH"
      ], upper(trimspace(health_check.type))) || (
        try(health_check.resource_path, null) == null || startswith(trimspace(health_check.resource_path), "/")
      )
    ])
    error_message = "resource_path must start with '/' when provided for HTTP or HTTPS health checks."
  }

  # String matching checks need a string to search for.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : !contains([
        "HTTP_STR_MATCH",
        "HTTPS_STR_MATCH"
      ], upper(trimspace(health_check.type))) || try(length(trimspace(health_check.search_string)), 0) > 0
    ])
    error_message = "HTTP_STR_MATCH and HTTPS_STR_MATCH health checks must define search_string."
  }

  # Calculated checks must know both the threshold and at least one child.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : upper(trimspace(health_check.type)) != "CALCULATED" || (
        try(health_check.child_health_threshold, null) != null &&
        (
          length(try(health_check.child_healthchecks, [])) +
          length(try(health_check.child_health_check_keys, []))
        ) > 0
      )
    ])
    error_message = "CALCULATED health checks must define child_health_threshold and at least one child health check reference."
  }

  # CloudWatch metric checks must know which alarm to monitor.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : upper(trimspace(health_check.type)) != "CLOUDWATCH_METRIC" || (
        try(health_check.cloudwatch_alarm, null) != null &&
        try(length(trimspace(health_check.cloudwatch_alarm.name)), 0) > 0 &&
        try(can(regex("^[a-z]{2}(-gov)?-[a-z0-9-]+-[0-9]+$", trimspace(health_check.cloudwatch_alarm.region))), false)
      )
    ])
    error_message = "CLOUDWATCH_METRIC health checks must define cloudwatch_alarm.name and a valid cloudwatch_alarm.region."
  }

  # Recovery control checks need the Route53 ARC routing control ARN.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : upper(trimspace(health_check.type)) != "RECOVERY_CONTROL" || try(length(trimspace(health_check.routing_control_arn)), 0) > 0
    ])
    error_message = "RECOVERY_CONTROL health checks must define routing_control_arn."
  }

  # Route53 only supports specific request intervals.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.request_interval, null) == null || contains([10, 30], health_check.request_interval)
    ])
    error_message = "request_interval must be 10 or 30 seconds when provided."
  }

  # Keep the failure threshold within Route53-supported bounds.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.failure_threshold, null) == null || (
        health_check.failure_threshold >= 1 &&
        health_check.failure_threshold <= 10
      )
    ])
    error_message = "failure_threshold must be between 1 and 10 when provided."
  }

  # Validate ports early to prevent invalid network settings from reaching AWS.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.port, null) == null || (
        health_check.port >= 1 &&
        health_check.port <= 65535
      )
    ])
    error_message = "port must be between 1 and 65535 when provided."
  }

  # Validate calculated health check thresholds.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.child_health_threshold, null) == null || (
        health_check.child_health_threshold >= 0 &&
        health_check.child_health_threshold <= 256
      )
    ])
    error_message = "child_health_threshold must be between 0 and 256 when provided."
  }

  # SNI only makes sense for HTTPS-based checks.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.enable_sni, null) == null || contains([
        "HTTPS",
        "HTTPS_STR_MATCH"
      ], upper(trimspace(health_check.type)))
    ])
    error_message = "enable_sni can only be set for HTTPS or HTTPS_STR_MATCH health checks."
  }

  # Limit insufficient data status to values supported by Route53.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : try(health_check.insufficient_data_health_status, null) == null || contains([
        "Healthy",
        "Unhealthy",
        "LastKnownStatus"
      ], trimspace(health_check.insufficient_data_health_status))
    ])
    error_message = "insufficient_data_health_status must be Healthy, Unhealthy, or LastKnownStatus when provided."
  }

  # Restrict health checker regions to the small set Route53 supports here.
  validation {
    condition = alltrue(flatten([
      for health_check in values(var.health_checks) : [
        for region in try(health_check.regions, []) : contains([
          "us-east-1",
          "us-west-1",
          "us-west-2",
          "eu-west-1",
          "ap-southeast-1",
          "ap-southeast-2",
          "ap-northeast-1",
          "sa-east-1"
        ], trimspace(region))
      ]
    ]))
    error_message = "regions may contain only Route53-supported health checker regions."
  }

  # Prevent duplicate or self-referencing child health check keys.
  validation {
    condition = alltrue([
      for key, health_check in var.health_checks : length(distinct([
        for child_key in try(health_check.child_health_check_keys, []) : trimspace(child_key)
      ])) == length(try(health_check.child_health_check_keys, [])) && !contains([
        for child_key in try(health_check.child_health_check_keys, []) : trimspace(child_key)
      ], trimspace(key))
    ])
    error_message = "child_health_check_keys must be unique and cannot reference the parent health check itself."
  }

  # Only CloudWatch metric checks use the triggers map.
  validation {
    condition = alltrue([
      for health_check in values(var.health_checks) : upper(trimspace(health_check.type)) == "CLOUDWATCH_METRIC" || length(try(health_check.triggers, {})) == 0
    ])
    error_message = "triggers can only be used with CLOUDWATCH_METRIC health checks."
  }
}

# Define the DNS records this module should create.
# The map key gives each record a stable logical identity so downstream modules
# can reference outputs consistently.
variable "records" {
  # Explain that the map is the main input for record creation.
  description = "Map of Route53 records keyed by a stable logical name."

  # Use a map(object(...)) so callers can create many records through one
  # module call while keeping each record configuration structured.
  type = map(object({
    # Optionally override the shared default_zone_id for a specific record.
    zone_id = optional(string)

    # This is the DNS name Route53 will create.
    name = string

    # This selects the DNS record type such as A, AAAA, CNAME, or TXT.
    type = string

    # For non-alias records, this controls how long DNS resolvers cache answers.
    ttl = optional(number)

    # For non-alias records, this is the list of record values Route53 returns.
    records = optional(list(string))

    # When true, Terraform is allowed to overwrite an existing record set.
    allow_overwrite = optional(bool, false)

    # Allow callers to attach an existing Route53 health check by raw AWS ID.
    health_check_id = optional(string)

    # Allow callers to attach a health check created inside this module.
    health_check_key = optional(string)

    # Route53 uses this to distinguish records that share the same name and type
    # but differ by routing policy.
    set_identifier = optional(string)

    # Use alias records when pointing to AWS-managed DNS targets such as
    # CloudFront distributions.
    alias = optional(object({
      # This is the DNS name of the alias target.
      name = string

      # This is the hosted zone ID of the alias target service.
      zone_id = string

      # When true, Route53 can use target health when answering DNS queries.
      evaluate_target_health = optional(bool, false)
    }))

    # CIDR routing sends responses based on the requester IP range collection.
    cidr_routing_policy = optional(object({
      # This selects the Route53 CIDR collection.
      collection_id = string

      # This selects the location name inside that collection.
      location_name = string
    }))

    # Failover routing is used for active-passive DNS strategies.
    failover_routing_policy = optional(object({
      # Route53 accepts only PRIMARY or SECONDARY here.
      type = string
    }))

    # Geolocation routing answers based on viewer continent, country, or subdivision.
    geolocation_routing_policy = optional(object({
      # Route by continent when set.
      continent = optional(string)

      # Route by country when set.
      country = optional(string)

      # Route by subdivision when set.
      subdivision = optional(string)
    }))

    # Geoproximity routing answers based on AWS region or geographic coordinates.
    geoproximity_routing_policy = optional(object({
      # Route using an AWS region as the traffic anchor.
      aws_region = optional(string)

      # Route using a local zone group as the traffic anchor.
      local_zone_group = optional(string)

      # Bias shifts more or less traffic toward this record.
      bias = optional(number)

      # Coordinates are used when routing toward a non-AWS location.
      coordinates = optional(object({
        # Latitude of the target location.
        latitude = string

        # Longitude of the target location.
        longitude = string
      }))
    }))

    # Latency routing answers based on the AWS region closest to users.
    latency_routing_policy = optional(object({
      # This is the AWS region Route53 uses for latency measurement.
      region = string
    }))

    # Weighted routing distributes traffic according to configured weights.
    weighted_routing_policy = optional(object({
      # Higher numbers receive proportionally more traffic.
      weight = number
    }))

    # Multivalue routing returns multiple healthy answers when enabled.
    multivalue_answer_routing_policy = optional(bool, false)
  }))

  # An empty map means the module can be instantiated without creating records.
  default = {}

  # Validate that every logical key is usable.
  validation {
    condition     = alltrue([for key in keys(var.records) : length(trimspace(key)) > 0])
    error_message = "records keys must be non-empty strings."
  }

  # Validate explicit per-record zone IDs when callers provide them.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.zone_id, null) == null || can(regex("^Z[A-Z0-9]+$", trimspace(record.zone_id)))
    ])
    error_message = "zone_id must be a valid Route53 hosted zone ID when provided."
  }

  # Record names must not be blank or contain spaces.
  validation {
    condition = alltrue([
      for record in values(var.records) : (
        length(trimspace(record.name)) > 0 &&
        length(regexall("\\s", trimspace(record.name))) == 0
      )
    ])
    error_message = "Each record name must be non-empty and must not contain whitespace."
  }

  # Restrict record types to values supported by the provider and Route53.
  validation {
    condition = alltrue([
      for record in values(var.records) : contains([
        "A",
        "AAAA",
        "CAA",
        "CNAME",
        "DS",
        "HTTPS",
        "MX",
        "NAPTR",
        "NS",
        "PTR",
        "SOA",
        "SPF",
        "SRV",
        "SSHFP",
        "SVCB",
        "TLSA",
        "TXT"
      ], upper(trimspace(record.type)))
    ])
    error_message = "Each records entry must use a supported Route53 record type."
  }

  # A record must be either an alias record or a standard record, not both.
  validation {
    condition = alltrue([
      for record in values(var.records) : (
        try(record.alias, null) != null &&
        try(record.ttl, null) == null &&
        try(length(record.records), 0) == 0 &&
        contains(["A", "AAAA"], upper(trimspace(record.type)))
        ) || (
        try(record.alias, null) == null &&
        try(record.ttl, null) != null &&
        try(record.ttl, -1) >= 0 &&
        try(record.ttl, 2147483648) <= 2147483647 &&
        try(length(record.records), 0) > 0
      )
    ])
    error_message = "Each record must define either an alias target for A or AAAA alias records or ttl plus one or more records values for standard records."
  }

  # Alias targets also need valid values because Route53 sends traffic to them.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.alias, null) == null || (
        length(trimspace(record.alias.name)) > 0 &&
        length(regexall("\\s", trimspace(record.alias.name))) == 0 &&
        can(regex("^Z[A-Z0-9]+$", trimspace(record.alias.zone_id)))
      )
    ])
    error_message = "Alias records must include a non-empty alias target name without whitespace and a valid Route53 hosted zone ID."
  }

  # Standard record value lists must not contain blank strings.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.alias, null) != null || alltrue([
        for value in try(record.records, []) : length(trimspace(value)) > 0
      ])
    ])
    error_message = "Standard records must not contain empty records values."
  }

  # Existing health check IDs should not be blank when set.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.health_check_id, null) == null || length(trimspace(record.health_check_id)) > 0
    ])
    error_message = "health_check_id must be a non-empty string when provided."
  }

  # Module-managed health check keys should not be blank when set.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.health_check_key, null) == null || length(trimspace(record.health_check_key)) > 0
    ])
    error_message = "health_check_key must be a non-empty string when provided."
  }

  # Use either a raw ID or a logical key so configuration stays unambiguous.
  validation {
    condition = alltrue([
      for record in values(var.records) : !(try(record.health_check_id, null) != null && try(record.health_check_key, null) != null)
    ])
    error_message = "Use either health_check_id or health_check_key on a record, not both."
  }

  # Weighted routing values must stay inside Route53-supported limits.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.weighted_routing_policy.weight, null) == null || (
        try(record.weighted_routing_policy.weight, -1) >= 0 &&
        try(record.weighted_routing_policy.weight, 256) <= 255
      )
    ])
    error_message = "weighted_routing_policy.weight must be between 0 and 255."
  }

  # Failover routing only accepts PRIMARY or SECONDARY.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.failover_routing_policy.type, null) == null || contains([
        "PRIMARY",
        "SECONDARY"
      ], upper(trimspace(record.failover_routing_policy.type)))
    ])
    error_message = "failover_routing_policy.type must be PRIMARY or SECONDARY."
  }

  # Failover records need some health signal so Route53 knows when to switch.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.failover_routing_policy, null) == null || (
        try(record.health_check_id, null) != null ||
        try(record.health_check_key, null) != null ||
        try(record.alias.evaluate_target_health, false)
      )
    ])
    error_message = "Failover records must reference a health check directly, reference one by key, or use an alias target with evaluate_target_health = true."
  }

  # Validate latency routing region names.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.latency_routing_policy.region, null) == null || can(regex(
        "^[a-z]{2}(-gov)?-[a-z0-9-]+-[0-9]+$",
        trimspace(record.latency_routing_policy.region)
      ))
    ])
    error_message = "latency_routing_policy.region must look like a valid AWS region name, for example ap-southeast-1."
  }

  # CIDR routing needs both the collection ID and the location name.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.cidr_routing_policy, null) == null || (
        length(trimspace(record.cidr_routing_policy.collection_id)) > 0 &&
        length(trimspace(record.cidr_routing_policy.location_name)) > 0
      )
    ])
    error_message = "cidr_routing_policy must define non-empty collection_id and location_name values."
  }

  # Geolocation routing needs at least a continent or country selector.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.geolocation_routing_policy, null) == null || (
        try(record.geolocation_routing_policy.continent, null) != null ||
        try(record.geolocation_routing_policy.country, null) != null
      )
    ])
    error_message = "geolocation_routing_policy must define continent or country."
  }

  # A subdivision is only meaningful when a country is also defined.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.geolocation_routing_policy.subdivision, null) == null || try(record.geolocation_routing_policy.country, null) != null
    ])
    error_message = "geolocation_routing_policy.subdivision requires geolocation_routing_policy.country."
  }

  # Geoproximity routing must use exactly one location anchor.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.geoproximity_routing_policy, null) == null || (
        (
          (try(record.geoproximity_routing_policy.aws_region, null) != null ? 1 : 0) +
          (try(record.geoproximity_routing_policy.local_zone_group, null) != null ? 1 : 0) +
          (try(record.geoproximity_routing_policy.coordinates, null) != null ? 1 : 0)
        ) == 1 &&
        (
          try(record.geoproximity_routing_policy.bias, null) == null || (
            try(record.geoproximity_routing_policy.bias, -91) >= -90 &&
            try(record.geoproximity_routing_policy.bias, 91) <= 90
          )
        )
      )
    ])
    error_message = "geoproximity_routing_policy must define exactly one of aws_region, local_zone_group, or coordinates, and bias must be between -90 and 90 when provided."
  }

  # Validate the coordinate string format when geographic coordinates are used.
  validation {
    condition = alltrue([
      for record in values(var.records) : try(record.geoproximity_routing_policy.coordinates, null) == null || (
        can(regex("^-?[0-9]{1,3}(\\.[0-9]+)?$", trimspace(record.geoproximity_routing_policy.coordinates.latitude))) &&
        can(regex("^-?[0-9]{1,3}(\\.[0-9]+)?$", trimspace(record.geoproximity_routing_policy.coordinates.longitude)))
      )
    ])
    error_message = "geoproximity_routing_policy.coordinates latitude and longitude must be valid decimal values when provided."
  }

  # Route53 allows only one routing policy family per record set.
  validation {
    condition = alltrue([
      for record in values(var.records) : (
        (try(record.cidr_routing_policy, null) != null ? 1 : 0) +
        (try(record.failover_routing_policy, null) != null ? 1 : 0) +
        (try(record.geolocation_routing_policy, null) != null ? 1 : 0) +
        (try(record.geoproximity_routing_policy, null) != null ? 1 : 0) +
        (try(record.latency_routing_policy, null) != null ? 1 : 0) +
        (try(record.weighted_routing_policy, null) != null ? 1 : 0) +
        (try(record.multivalue_answer_routing_policy, false) ? 1 : 0)
      ) <= 1
    ])
    error_message = "Each record can use at most one routing policy: cidr, failover, geolocation, geoproximity, latency, weighted, or multivalue."
  }

  # Routed records need a set_identifier so Route53 can distinguish them.
  validation {
    condition = alltrue([
      for record in values(var.records) : (
        try(record.cidr_routing_policy, null) == null &&
        try(record.failover_routing_policy, null) == null &&
        try(record.geolocation_routing_policy, null) == null &&
        try(record.geoproximity_routing_policy, null) == null &&
        try(record.latency_routing_policy, null) == null &&
        try(record.weighted_routing_policy, null) == null &&
        !try(record.multivalue_answer_routing_policy, false)
        ) || (
        try(record.set_identifier, null) != null &&
        length(trimspace(record.set_identifier)) > 0
      )
    ])
    error_message = "set_identifier is required when using cidr, failover, geolocation, geoproximity, latency, weighted, or multivalue routing policies."
  }
}

# Choose one record key to back the compatibility fqdn output.
# This is helpful when the module creates multiple records but another module
# still expects a single top-level hostname output.
variable "primary_record_key" {
  # Explain why this variable exists.
  description = "Optional key from records used for the fqdn output when multiple records are managed."

  # Record keys are strings because they come from the records map.
  type = string

  # Default to null so callers can omit it when they manage only one record.
  default = null

  # Allow null explicitly.
  nullable = true

  # Prevent accidental blank strings.
  validation {
    condition     = var.primary_record_key == null || length(trimspace(var.primary_record_key)) > 0
    error_message = "primary_record_key must be null or a non-empty record key."
  }
}

# Apply tags to managed Route53 health checks.
# Route53 record resources themselves do not support tags, so this variable is
# intentionally limited to health checks.
variable "tags" {
  # Clarify that tags affect health checks only.
  description = "Optional tags applied to managed Route53 health checks. Route53 record resources do not support tags."

  # Tags are key-value string pairs.
  type = map(string)

  # Default to no additional tags.
  default = {}
}