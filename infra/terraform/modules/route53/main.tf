# This file is the execution heart of the module.
# It contains four kinds of logic:
# 1. check blocks that fail fast with clear messages
# 2. optional Route53 health checks
# 3. Route53 records
# 4. dynamic routing-policy blocks that expand only when needed

# Check that the optional primary record key points to a real record.
# This check runs during planning and gives a friendly error before any AWS
# API call is attempted.
check "route53_primary_record_key" {
  assert {
    # Pass when primary_record_key is null, or when it matches one of the
    # normalized record keys.
    condition = var.primary_record_key == null || contains(keys(local.normalized_records), trimspace(var.primary_record_key))

    # Explain the failure clearly for the caller.
    error_message = "primary_record_key must match one of the keys defined in records."
  }
}

# Check that every record ends up with a hosted zone ID.
# This protects against forgetting both record.zone_id and default_zone_id.
check "route53_record_zone_ids" {
  assert {
    # alltrue requires every normalized record to have a non-null zone_id.
    condition = alltrue([for record in values(local.normalized_records) : record.zone_id != null])

    # The message explains both ways callers can satisfy the requirement.
    error_message = "Each record must define zone_id directly or inherit it from default_zone_id."
  }
}

# Check that every health_check_key used by a record points to a real health
# check defined in this module call.
check "route53_record_health_check_keys" {
  assert {
    # The for expression walks every raw record input.
    # If a health_check_key is set, contains verifies the key exists.
    condition = alltrue([
      for record in values(var.records) : try(record.health_check_key, null) == null || contains(keys(var.health_checks), trimspace(record.health_check_key))
    ])

    # The message teaches the user what object must exist.
    error_message = "Each record.health_check_key must reference a key defined in health_checks."
  }
}

# Check that calculated health checks only reference known child health checks.
check "route53_child_health_check_keys" {
  assert {
    # flatten turns a list of lists into a single list of booleans.
    # alltrue then ensures every referenced child key exists.
    condition = alltrue(flatten([
      for health_check in values(var.health_checks) : [
        for child_key in try(health_check.child_health_check_keys, []) : contains(keys(var.health_checks), trimspace(child_key))
      ]
    ]))

    # This tells the caller exactly what was wrong.
    error_message = "Each child_health_check_keys entry must reference a key defined in health_checks."
  }
}

# Create optional Route53 health checks.
# for_each is used here because the module may need zero, one, or many health checks.
# each.key is the logical health check name from var.health_checks.
# each.value is the fully normalized configuration object from locals.tf.
resource "aws_route53_health_check" "this" {
  # Create one resource instance per entry in normalized_health_checks.
  # If the map is empty, Terraform creates no health checks.
  for_each = local.normalized_health_checks

  # Use the normalized type value so comparisons and provider input stay consistent.
  type = each.value.type

  # Pass through the optional reference name used for identification in AWS.
  reference_name = each.value.reference_name

  # Pass the normalized fqdn when the health check type supports it.
  fqdn = each.value.fqdn

  # Pass the normalized IP address when the health check type supports it.
  ip_address = each.value.ip_address

  # Pass the resolved port value.
  port = each.value.port

  # Pass the normalized resource path for HTTP-style checks.
  resource_path = each.value.resource_path

  # Pass the search string only for string match checks.
  search_string = each.value.search_string

  # Pass the failure threshold when the check type supports it.
  failure_threshold = each.value.failure_threshold

  # Pass the request interval when the check type supports it.
  request_interval = each.value.request_interval

  # Enable latency collection only for endpoint checks.
  measure_latency = each.value.measure_latency

  # Preserve optional health inversion behavior.
  invert_healthcheck = each.value.invert_healthcheck

  # Preserve optional disabled state.
  disabled = each.value.disabled

  # Enable SNI when relevant for HTTPS-based checks.
  enable_sni = each.value.enable_sni

  # For calculated checks, combine directly supplied child IDs with IDs resolved
  # from child_health_check_keys.
  # distinct removes duplicates and compact removes null values.
  # For all other check types, return null so Terraform omits the argument.
  child_healthchecks = each.value.type == "CALCULATED" ? distinct(compact(concat(each.value.child_healthchecks, [for child_key in each.value.child_health_check_keys : try(aws_route53_health_check.this[child_key].id, null)]))) : null

  # Only calculated checks need a child health threshold.
  child_health_threshold = each.value.type == "CALCULATED" ? each.value.child_health_threshold : null

  # Only CloudWatch metric checks need an alarm name.
  cloudwatch_alarm_name = each.value.type == "CLOUDWATCH_METRIC" && each.value.cloudwatch_alarm != null ? each.value.cloudwatch_alarm.name : null

  # Only CloudWatch metric checks need an alarm region.
  cloudwatch_alarm_region = each.value.type == "CLOUDWATCH_METRIC" && each.value.cloudwatch_alarm != null ? each.value.cloudwatch_alarm.region : null

  # For CloudWatch metric checks, default insufficient data behavior to LastKnownStatus
  # when the caller does not choose a different value.
  insufficient_data_health_status = each.value.type == "CLOUDWATCH_METRIC" ? coalesce(each.value.insufficient_data_health_status, "LastKnownStatus") : null

  # Restrict health checker regions when the caller requested it.
  regions = each.value.regions

  # Only recovery control checks need this ARN.
  routing_control_arn = each.value.type == "RECOVERY_CONTROL" ? each.value.routing_control_arn : null

  # Only CloudWatch metric checks use triggers.
  # When the map is empty, return null so the argument is omitted.
  triggers = each.value.type == "CLOUDWATCH_METRIC" && length(each.value.triggers) > 0 ? each.value.triggers : null

  # Merge module-level tags with per-health-check tags.
  # Per-health-check tags win when the same key appears in both maps.
  tags = merge(var.tags, each.value.tags)
}

# Create Route53 records.
# for_each is used because DNS modules often manage many related records at once.
# each.key is the logical record key from var.records.
# each.value is the normalized record configuration built in locals.tf.
resource "aws_route53_record" "this" {
  # Create one record resource for each normalized record entry.
  for_each = local.normalized_records

  # This is the hosted zone where Route53 stores the record set.
  zone_id = each.value.zone_id

  # This is the DNS name Route53 creates.
  name = each.value.name

  # This is the record type such as A, AAAA, CNAME, or TXT.
  type = each.value.type

  # Alias records do not accept ttl, so locals.tf already set this to null for aliases.
  ttl = each.value.alias == null ? each.value.ttl : null

  # Standard records use literal values, while alias records omit this argument.
  records = each.value.alias == null ? each.value.records : null

  # Allow overwrite only when the caller intentionally enabled it.
  allow_overwrite = each.value.allow_overwrite

  # Attach a resolved health check ID when one exists.
  health_check_id = each.value.health_check_id

  # Routed records use this identifier so Route53 can tell sibling records apart.
  set_identifier = each.value.set_identifier

  # Multivalue routing is represented as a top-level boolean instead of a nested block.
  # When false, null omits the argument entirely.
  multivalue_answer_routing_policy = each.value.multivalue_answer_routing_policy ? true : null

  # Dynamic blocks are used when nested configuration is optional.
  # Terraform only renders a dynamic block when its for_each expression contains data.
  # This keeps one resource block flexible enough to handle many Route53 record styles.
  dynamic "alias" {
    # Create exactly one alias block when alias data exists.
    # Create no alias blocks when the record is not an alias record.
    for_each = each.value.alias == null ? [] : [each.value.alias]

    content {
      # This is the target DNS name Route53 points the alias to.
      name = alias.value.name

      # This is the hosted zone of the alias target service.
      zone_id = alias.value.zone_id

      # This tells Route53 whether it can use target health when answering queries.
      evaluate_target_health = alias.value.evaluate_target_health
    }
  }

  # Render CIDR routing only when the caller configured it.
  dynamic "cidr_routing_policy" {
    # One block is rendered when CIDR routing is configured, otherwise none.
    for_each = each.value.cidr_routing_policy == null ? [] : [each.value.cidr_routing_policy]

    content {
      # This identifies the CIDR collection Route53 uses.
      collection_id = cidr_routing_policy.value.collection_id

      # This identifies the location entry inside that collection.
      location_name = cidr_routing_policy.value.location_name
    }
  }

  # Render failover routing only when the caller configured it.
  dynamic "failover_routing_policy" {
    # One block is rendered when failover routing is configured, otherwise none.
    for_each = each.value.failover_routing_policy == null ? [] : [each.value.failover_routing_policy]

    content {
      # Route53 uses this to know whether the record is PRIMARY or SECONDARY.
      type = failover_routing_policy.value.type
    }
  }

  # Render geolocation routing only when the caller configured it.
  dynamic "geolocation_routing_policy" {
    # One block is rendered when geolocation routing is configured, otherwise none.
    for_each = each.value.geolocation_routing_policy == null ? [] : [each.value.geolocation_routing_policy]

    content {
      # Route traffic by continent when this value is set.
      continent = geolocation_routing_policy.value.continent

      # Route traffic by country when this value is set.
      country = geolocation_routing_policy.value.country

      # Route traffic by subdivision when this value is set.
      subdivision = geolocation_routing_policy.value.subdivision
    }
  }

  # Render geoproximity routing only when the caller configured it.
  dynamic "geoproximity_routing_policy" {
    # One block is rendered when geoproximity routing is configured, otherwise none.
    for_each = each.value.geoproximity_routing_policy == null ? [] : [each.value.geoproximity_routing_policy]

    content {
      # Anchor traffic using an AWS region when configured.
      aws_region = geoproximity_routing_policy.value.aws_region

      # Anchor traffic using a local zone group when configured.
      local_zone_group = geoproximity_routing_policy.value.local_zone_group

      # Shift more or less traffic toward this record.
      bias = geoproximity_routing_policy.value.bias

      # coordinates is another optional nested block inside geoproximity.
      # It exists only when the caller used explicit latitude and longitude.
      dynamic "coordinates" {
        # Create one coordinates block when coordinate data exists.
        # Create none when traffic is anchored by AWS region or local zone group instead.
        for_each = geoproximity_routing_policy.value.coordinates == null ? [] : [geoproximity_routing_policy.value.coordinates]

        content {
          # Latitude for the non-AWS routing target.
          latitude = coordinates.value.latitude

          # Longitude for the non-AWS routing target.
          longitude = coordinates.value.longitude
        }
      }
    }
  }

  # Render latency routing only when the caller configured it.
  dynamic "latency_routing_policy" {
    # One block is rendered when latency routing is configured, otherwise none.
    for_each = each.value.latency_routing_policy == null ? [] : [each.value.latency_routing_policy]

    content {
      # This is the AWS region Route53 uses as the latency target.
      region = latency_routing_policy.value.region
    }
  }

  # Render weighted routing only when the caller configured it.
  dynamic "weighted_routing_policy" {
    # One block is rendered when weighted routing is configured, otherwise none.
    for_each = each.value.weighted_routing_policy == null ? [] : [each.value.weighted_routing_policy]

    content {
      # This numeric weight influences how much traffic this record receives.
      weight = weighted_routing_policy.value.weight
    }
  }
}