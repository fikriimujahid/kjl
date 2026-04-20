# This file contains local values.
# Locals are like helper variables inside the module.
# They are useful when the same transformation must be reused in multiple
# places, or when raw input values need to be cleaned up before resources use them.

locals {
  # Normalize health check input so resource blocks can stay simple.
  # This local removes whitespace, applies defaults, and converts empty strings
  # into null values that Terraform can safely omit.
  normalized_health_checks = {
    # Use a for expression to transform each caller-supplied health check into
    # a cleaned internal object.
    # key is the logical map key from var.health_checks.
    # health_check is the full object for that one entry.
    for key, health_check in var.health_checks : key => {
      # Force the type value to upper case so later comparisons are consistent.
      type = upper(trimspace(health_check.type))

      # Remove accidental whitespace from reference_name and convert blank text
      # to null so Terraform omits the argument.
      reference_name = try(trimspace(health_check.reference_name), "") == "" ? null : trimspace(health_check.reference_name)

      # Normalize fqdn so Route53 receives a clean hostname when one is set.
      fqdn = try(trimspace(health_check.fqdn), "") == "" ? null : trimspace(health_check.fqdn)

      # Normalize ip_address for the same reason as fqdn.
      ip_address = try(trimspace(health_check.ip_address), "") == "" ? null : trimspace(health_check.ip_address)

      # Choose the port to use.
      # If the caller provided one, keep it.
      # Otherwise default HTTP checks to 80 and HTTPS checks to 443.
      port = try(health_check.port, null) != null ? health_check.port : (
        contains(["HTTP", "HTTP_STR_MATCH"], upper(trimspace(health_check.type))) ? 80 : (
          contains(["HTTPS", "HTTPS_STR_MATCH"], upper(trimspace(health_check.type))) ? 443 : null
        )
      )

      # For HTTP-style checks, default a blank path to "/".
      # For other check types, omit resource_path entirely.
      resource_path = contains(["HTTP", "HTTPS", "HTTP_STR_MATCH", "HTTPS_STR_MATCH"], upper(trimspace(health_check.type))) ? (
        try(trimspace(health_check.resource_path), "") == "" ? "/" : trimspace(health_check.resource_path)
      ) : null

      # Only string match checks need a search_string.
      search_string = contains(["HTTP_STR_MATCH", "HTTPS_STR_MATCH"], upper(trimspace(health_check.type))) ? trimspace(health_check.search_string) : null

      # Endpoint checks support failure thresholds.
      # When callers omit this, use 3 as a practical default.
      failure_threshold = contains(["HTTP", "HTTPS", "HTTP_STR_MATCH", "HTTPS_STR_MATCH", "TCP"], upper(trimspace(health_check.type))) ? coalesce(try(health_check.failure_threshold, null), 3) : null

      # Endpoint checks support request intervals.
      # Default to 30 seconds when callers do not override it.
      request_interval = contains(["HTTP", "HTTPS", "HTTP_STR_MATCH", "HTTPS_STR_MATCH", "TCP"], upper(trimspace(health_check.type))) ? coalesce(try(health_check.request_interval, null), 30) : null

      # Only endpoint checks can collect latency measurements.
      measure_latency = contains(["HTTP", "HTTPS", "HTTP_STR_MATCH", "HTTPS_STR_MATCH", "TCP"], upper(trimspace(health_check.type))) ? try(health_check.measure_latency, false) : null

      # Keep the caller's invert flag so Route53 can reverse healthy and unhealthy states when needed.
      invert_healthcheck = try(health_check.invert_healthcheck, false)

      # Keep the caller's disabled flag so health checks can be paused without being deleted.
      disabled = try(health_check.disabled, false)

      # For HTTPS checks, enable SNI by default when the caller does not decide explicitly.
      enable_sni = contains(["HTTPS", "HTTPS_STR_MATCH"], upper(trimspace(health_check.type))) ? coalesce(try(health_check.enable_sni, null), true) : try(health_check.enable_sni, null)

      # Clean the list of directly supplied child health check IDs.
      # distinct prevents duplicates from being sent to Route53.
      child_healthchecks = distinct([for child_id in try(health_check.child_healthchecks, []) : trimspace(child_id)])

      # Clean the list of child keys that refer to other health checks in this module.
      child_health_check_keys = distinct([for child_key in try(health_check.child_health_check_keys, []) : trimspace(child_key)])

      # Keep the threshold for calculated checks if one was provided.
      child_health_threshold = try(health_check.child_health_threshold, null)

      # Normalize the optional CloudWatch alarm object so downstream resource
      # code can reference stable field names.
      cloudwatch_alarm = try(health_check.cloudwatch_alarm, null) == null ? null : {
        # Trim the alarm name to avoid accidental whitespace mismatches.
        name = trimspace(health_check.cloudwatch_alarm.name)

        # Trim the alarm region for the same reason.
        region = trimspace(health_check.cloudwatch_alarm.region)
      }

      # Convert blank insufficient data settings to null so Terraform omits the argument.
      insufficient_data_health_status = try(trimspace(health_check.insufficient_data_health_status), "") == "" ? null : trimspace(health_check.insufficient_data_health_status)

      # Normalize checker regions.
      # If the list is empty, return null so Route53 uses its default regions.
      regions = length(try(health_check.regions, [])) == 0 ? null : distinct([for region in health_check.regions : trimspace(region)])

      # Clean up the optional routing control ARN.
      routing_control_arn = try(trimspace(health_check.routing_control_arn), "") == "" ? null : trimspace(health_check.routing_control_arn)

      # Keep the triggers map exactly as supplied because it is used to force updates.
      triggers = try(health_check.triggers, {})

      # Keep health-check-specific tags so they can later be merged with module-level tags.
      tags = try(health_check.tags, {})
    }
  }

  # Normalize record input so the resource block can read a consistent shape.
  # This local is important because records can mix explicit values, inherited
  # defaults, optional routing policies, and optional health check references.
  normalized_records = {
    # Use a for expression to transform each record into a clean internal object.
    # key is the logical record key.
    # record is the caller-supplied record definition.
    for key, record in var.records : key => {
      # Pick the record zone_id.
      # First prefer a record-specific zone_id.
      # If that is missing, fall back to default_zone_id.
      zone_id = coalesce(
        try(trimspace(record.zone_id), "") == "" ? null : trimspace(record.zone_id),
        var.default_zone_id == null ? null : trimspace(var.default_zone_id)
      )

      # Remove whitespace from the record name before sending it to Route53.
      name = trimspace(record.name)

      # Standardize the record type to upper case for consistent comparisons.
      type = upper(trimspace(record.type))

      # Alias records do not use ttl, so return null in that case.
      ttl = try(record.alias, null) != null ? null : try(record.ttl, null)

      # Alias records do not use literal record values.
      # For standard records, trim all values in the records list.
      records = try(record.alias, null) != null ? null : [for value in try(record.records, []) : trimspace(value)]

      # Preserve the allow_overwrite flag exactly as configured.
      allow_overwrite = try(record.allow_overwrite, false)

      # Normalize the optional logical health check key used for module-managed health checks.
      health_check_key = try(trimspace(record.health_check_key), "") == "" ? null : trimspace(record.health_check_key)

      # Resolve the final health_check_id for the record.
      # Prefer an explicitly provided AWS health check ID.
      # Otherwise, if the record references a health_check_key, look up the ID
      # from the health checks created by this module.
      health_check_id = try(trimspace(record.health_check_id), "") != "" ? trimspace(record.health_check_id) : (
        try(trimspace(record.health_check_key), "") != "" ? try(aws_route53_health_check.this[trimspace(record.health_check_key)].id, null) : null
      )

      # Normalize the set identifier used by routed record sets.
      set_identifier = try(trimspace(record.set_identifier), "") == "" ? null : trimspace(record.set_identifier)

      # Normalize the alias target block when it exists.
      alias = try(record.alias, null) == null ? null : {
        # Clean the alias target DNS name.
        name = trimspace(record.alias.name)

        # Clean the alias target hosted zone ID.
        zone_id = trimspace(record.alias.zone_id)

        # Preserve the evaluate_target_health setting.
        evaluate_target_health = try(record.alias.evaluate_target_health, false)
      }

      # Normalize CIDR routing settings when present.
      cidr_routing_policy = try(record.cidr_routing_policy, null) == null ? null : {
        # Clean the CIDR collection ID string.
        collection_id = trimspace(record.cidr_routing_policy.collection_id)

        # Clean the CIDR location name string.
        location_name = trimspace(record.cidr_routing_policy.location_name)
      }

      # Normalize failover routing settings when present.
      failover_routing_policy = try(record.failover_routing_policy, null) == null ? null : {
        # Standardize PRIMARY and SECONDARY values to upper case.
        type = upper(trimspace(record.failover_routing_policy.type))
      }

      # Normalize geolocation routing settings when present.
      geolocation_routing_policy = try(record.geolocation_routing_policy, null) == null ? null : {
        # Clean optional continent values.
        continent = try(record.geolocation_routing_policy.continent, null) == null ? null : trimspace(record.geolocation_routing_policy.continent)

        # Clean optional country values.
        country = try(record.geolocation_routing_policy.country, null) == null ? null : trimspace(record.geolocation_routing_policy.country)

        # Clean optional subdivision values.
        subdivision = try(record.geolocation_routing_policy.subdivision, null) == null ? null : trimspace(record.geolocation_routing_policy.subdivision)
      }

      # Normalize geoproximity routing settings when present.
      geoproximity_routing_policy = try(record.geoproximity_routing_policy, null) == null ? null : {
        # Clean the optional AWS region anchor.
        aws_region = try(record.geoproximity_routing_policy.aws_region, null) == null ? null : trimspace(record.geoproximity_routing_policy.aws_region)

        # Clean the optional local zone group anchor.
        local_zone_group = try(record.geoproximity_routing_policy.local_zone_group, null) == null ? null : trimspace(record.geoproximity_routing_policy.local_zone_group)

        # Keep the optional bias value unchanged.
        bias = try(record.geoproximity_routing_policy.bias, null)

        # Normalize coordinates when geographic coordinates are used instead of AWS anchors.
        coordinates = try(record.geoproximity_routing_policy.coordinates, null) == null ? null : {
          # Clean latitude text.
          latitude = trimspace(record.geoproximity_routing_policy.coordinates.latitude)

          # Clean longitude text.
          longitude = trimspace(record.geoproximity_routing_policy.coordinates.longitude)
        }
      }

      # Normalize latency routing settings when present.
      latency_routing_policy = try(record.latency_routing_policy, null) == null ? null : {
        # Clean the AWS region string.
        region = trimspace(record.latency_routing_policy.region)
      }

      # Normalize weighted routing settings when present.
      weighted_routing_policy = try(record.weighted_routing_policy, null) == null ? null : {
        # Keep the numeric weight exactly as configured.
        weight = record.weighted_routing_policy.weight
      }

      # Keep the multivalue flag exactly as configured.
      multivalue_answer_routing_policy = try(record.multivalue_answer_routing_policy, false)
    }
  }

  # Decide which record key should drive the top-level fqdn output.
  # If the caller explicitly sets primary_record_key, use it.
  # Otherwise, when exactly one record exists, automatically select that record.
  # When multiple records exist and no key is supplied, return null.
  primary_record_key = var.primary_record_key != null ? trimspace(var.primary_record_key) : (
    length(local.normalized_records) == 1 ? keys(local.normalized_records)[0] : null
  )
}