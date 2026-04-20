# This file defines the public outputs of the module.
# Outputs are the values that other modules, root configurations, or human
# operators can read after Terraform finishes planning or applying.

# Expose a single fqdn value for compatibility with callers that expect one
# primary DNS result.
output "fqdn" {
  # Describe exactly what this output returns and when it may be null.
  description = "FQDN for the selected primary record. Returns null when multiple records exist and no primary_record_key is set."

  # If no primary record key is resolved, return null.
  # Otherwise, look up the fqdn attribute of that specific Route53 record.
  value = local.primary_record_key == null ? null : aws_route53_record.this[local.primary_record_key].fqdn
}

# Expose which key was chosen as the primary record.
# This helps beginners understand why fqdn points to a specific record.
output "selected_primary_record_key" {
  # Describe the meaning of the output.
  description = "Resolved primary record key used by the fqdn output."

  # Return the resolved key from locals.tf.
  value = local.primary_record_key
}

# Expose Route53 record IDs keyed by the logical record key.
output "record_ids" {
  # Explain what the map contains.
  description = "Map of logical record keys to Terraform Route53 record IDs."

  # Use a for expression to build a map.
  # key is the logical record key.
  # record is the aws_route53_record resource instance.
  value = {
    for key, record in aws_route53_record.this : key => record.id
  }
}

# Expose Route53 record names keyed by the logical record key.
output "record_names" {
  # Explain what the map contains.
  description = "Map of logical record keys to Route53 record names."

  # Build a simple map of logical key to final DNS name.
  value = {
    for key, record in aws_route53_record.this : key => record.name
  }
}

# Expose Route53 fully qualified domain names keyed by logical record key.
output "record_fqdns" {
  # Explain what the map contains.
  description = "Map of logical record keys to fully qualified domain names created in Route53."

  # Build a map of logical key to fqdn.
  value = {
    for key, record in aws_route53_record.this : key => record.fqdn
  }
}

# Expose Route53 record types keyed by logical record key.
output "record_types" {
  # Explain what the map contains.
  description = "Map of logical record keys to Route53 record types."

  # Build a map of logical key to record type.
  value = {
    for key, record in aws_route53_record.this : key => record.type
  }
}

# Expose hosted zone IDs keyed by logical record key.
output "record_zone_ids" {
  # Explain what the map contains.
  description = "Map of logical record keys to Route53 hosted zone IDs."

  # Build a map of logical key to hosted zone ID.
  value = {
    for key, record in aws_route53_record.this : key => record.zone_id
  }
}

# Expose which health check ID, if any, each record resolved to.
output "record_health_check_ids" {
  # Explain what the map contains.
  description = "Map of logical record keys to associated Route53 health check IDs when present."

  # Read from normalized_records because this value may come from either a raw
  # health_check_id or a module-managed health_check_key.
  value = {
    for key, record in local.normalized_records : key => record.health_check_id
  }
}

# Expose Route53 set identifiers used for routing policies.
output "record_set_identifiers" {
  # Explain what the map contains.
  description = "Map of logical record keys to Route53 set identifiers when routing policies are used."

  # Read from normalized_records because set_identifier is input-driven metadata.
  value = {
    for key, record in local.normalized_records : key => record.set_identifier
  }
}

# Expose alias target details so downstream modules can inspect alias routing.
output "record_alias_targets" {
  # Explain what the map contains.
  description = "Map of logical record keys to alias target details when records use Route53 alias targets."

  # Read from normalized_records because alias data is already cleaned there.
  value = {
    for key, record in local.normalized_records : key => record.alias
  }
}

# Expose a rich structured object for each Route53 record.
# This is useful when downstream modules need more than one simple field.
output "record_details" {
  # Explain what the output contains.
  description = "Structured details for each Route53 record managed by this module."

  # Build a nested map of per-record details.
  # key is the logical record key.
  # record is the created aws_route53_record resource instance.
  value = {
    for key, record in aws_route53_record.this : key => {
      # Expose the Terraform/AWS record ID.
      id = record.id

      # Expose the final record name.
      name = record.name

      # Expose the fully qualified DNS name.
      fqdn = record.fqdn

      # Expose the DNS record type.
      type = record.type

      # Expose the hosted zone ID where the record was created.
      zone_id = record.zone_id

      # Expose the final health check ID associated with the record.
      health_check_id = local.normalized_records[key].health_check_id

      # Expose the set identifier used by routing policies.
      set_identifier = local.normalized_records[key].set_identifier

      # Expose literal record values for standard records.
      records = local.normalized_records[key].records

      # Expose alias target details for alias records.
      alias = local.normalized_records[key].alias

      # Expose whether Terraform was allowed to overwrite existing records.
      allow_overwrite = local.normalized_records[key].allow_overwrite

      # Derive a simple label describing which routing policy is active.
      # This nested conditional logic is easier for beginners to consume than
      # checking many policy blocks individually.
      routing_policy = (
        local.normalized_records[key].cidr_routing_policy != null ? "cidr" : (
          local.normalized_records[key].failover_routing_policy != null ? "failover" : (
            local.normalized_records[key].geolocation_routing_policy != null ? "geolocation" : (
              local.normalized_records[key].geoproximity_routing_policy != null ? "geoproximity" : (
                local.normalized_records[key].latency_routing_policy != null ? "latency" : (
                  local.normalized_records[key].weighted_routing_policy != null ? "weighted" : (
                    local.normalized_records[key].multivalue_answer_routing_policy ? "multivalue" : null
                  )
                )
              )
            )
          )
        )
      )

      # Expose CIDR routing configuration when present.
      cidr_routing_policy = local.normalized_records[key].cidr_routing_policy

      # Expose failover routing configuration when present.
      failover_routing_policy = local.normalized_records[key].failover_routing_policy

      # Expose geolocation routing configuration when present.
      geolocation_routing_policy = local.normalized_records[key].geolocation_routing_policy

      # Expose geoproximity routing configuration when present.
      geoproximity_routing_policy = local.normalized_records[key].geoproximity_routing_policy

      # Expose latency routing configuration when present.
      latency_routing_policy = local.normalized_records[key].latency_routing_policy

      # Expose weighted routing configuration when present.
      weighted_routing_policy = local.normalized_records[key].weighted_routing_policy

      # Expose whether multivalue routing is enabled.
      multivalue_answer_routing_policy = local.normalized_records[key].multivalue_answer_routing_policy
    }
  }
}

# Expose created health check IDs keyed by logical health check key.
output "health_check_ids" {
  # Explain what the map contains.
  description = "Map of logical health check keys to Route53 health check IDs."

  # Build a map of logical health check key to AWS health check ID.
  value = {
    for key, health_check in aws_route53_health_check.this : key => health_check.id
  }
}

# Expose created health check ARNs keyed by logical health check key.
output "health_check_arns" {
  # Explain what the map contains.
  description = "Map of logical health check keys to Route53 health check ARNs."

  # Build a map of logical health check key to ARN.
  value = {
    for key, health_check in aws_route53_health_check.this : key => health_check.arn
  }
}

# Expose a rich structured object for each Route53 health check.
output "health_check_details" {
  # Explain what the output contains.
  description = "Structured details for each Route53 health check managed by this module."

  # Build a nested map of per-health-check details.
  value = {
    for key, health_check in aws_route53_health_check.this : key => {
      # Expose the AWS health check ID.
      id = health_check.id

      # Expose the AWS health check ARN.
      arn = health_check.arn

      # Expose the normalized health check type.
      type = local.normalized_health_checks[key].type

      # Expose the optional reference name.
      reference_name = local.normalized_health_checks[key].reference_name

      # Expose the final fqdn when applicable.
      fqdn = local.normalized_health_checks[key].fqdn

      # Expose the final IP address when applicable.
      ip_address = local.normalized_health_checks[key].ip_address

      # Expose the final port when applicable.
      port = local.normalized_health_checks[key].port

      # Expose the resource path for HTTP-style checks.
      resource_path = local.normalized_health_checks[key].resource_path

      # Expose the final request interval.
      request_interval = local.normalized_health_checks[key].request_interval

      # Expose the final failure threshold.
      failure_threshold = local.normalized_health_checks[key].failure_threshold

      # Expose CloudWatch alarm configuration when applicable.
      cloudwatch_alarm = local.normalized_health_checks[key].cloudwatch_alarm

      # Expose routing control ARN when applicable.
      routing_control_arn = local.normalized_health_checks[key].routing_control_arn

      # Expose direct child health check IDs for calculated checks.
      child_healthchecks = local.normalized_health_checks[key].child_healthchecks

      # Expose child health check keys for calculated checks.
      child_health_check_keys = local.normalized_health_checks[key].child_health_check_keys

      # Expose the child threshold for calculated checks.
      child_health_threshold = local.normalized_health_checks[key].child_health_threshold

      # Expose any custom checker regions.
      regions = local.normalized_health_checks[key].regions

      # Expose the merged final tag set applied to the health check.
      tags = merge(var.tags, local.normalized_health_checks[key].tags)
    }
  }
}