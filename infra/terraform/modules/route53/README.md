# Route53 Module

## Overview

This module creates Route53 DNS records and optional Route53 health checks.
It solves the common problem of managing many related DNS entries with one reusable Terraform module instead of writing one separate resource block for every record.

The module can create:
- Standard DNS records such as `CNAME`, `TXT`, and `MX`
- Alias records for AWS services such as CloudFront
- Routed records such as failover, weighted, latency, geolocation, geoproximity, CIDR, and multivalue records
- Optional Route53 health checks that DNS records can reference by logical key

This makes the module useful for multi-project and multi-environment DNS management.

## Architecture Diagram

```text
Application Users
				|
				v
		 Route53
	 /    |    \
	v     v     v
Alias  CNAME  TXT
	|      |
	v      v
CloudFront  Backend Hostname

Optional Health Checks
				|
				v
	 Route53 Failover Logic
```

Flow explanation:
- Route53 receives DNS queries from users.
- Depending on record type, Route53 returns alias targets, standard values, or routed answers.
- Optional health checks influence failover and other health-aware routing behavior.

## Resources Created

- `aws_route53_record`: Creates DNS records in the selected hosted zone.
- `aws_route53_health_check`: Creates optional Route53 health checks for endpoint monitoring, calculated checks, CloudWatch alarm checks, or recovery control checks.

## Input Variables

| Name | Type | Required | Description |
|---|---|---|---|
| `default_zone_id` | `string` | No | Shared Route53 hosted zone ID used when records do not define their own `zone_id`. Example: `Z1234567890ABC`. |
| `health_checks` | `map(object)` | No | Optional map of Route53 health checks keyed by logical name. Useful for failover records and reusable health monitoring. |
| `records` | `map(object)` | No | Map of DNS records keyed by logical name. Each object defines the record name, type, and optional routing or health settings. |
| `primary_record_key` | `string` | No | Optional logical record key used by the top-level `fqdn` output when more than one record is managed. |
| `tags` | `map(string)` | No | Tags applied to Route53 health checks created by the module. Route53 records themselves do not support tags. |

## Output Variables

| Name | Description |
|---|---|
| `fqdn` | Fully qualified domain name for the selected primary record. |
| `selected_primary_record_key` | Logical record key chosen for the `fqdn` output. |
| `record_ids` | Map of logical record keys to Route53 record IDs. |
| `record_names` | Map of logical record keys to created record names. |
| `record_fqdns` | Map of logical record keys to fully qualified domain names. |
| `record_types` | Map of logical record keys to DNS record types. |
| `record_zone_ids` | Map of logical record keys to hosted zone IDs. |
| `record_health_check_ids` | Map of logical record keys to resolved health check IDs. |
| `record_set_identifiers` | Map of logical record keys to routing-policy set identifiers. |
| `record_alias_targets` | Map of logical record keys to alias target details. |
| `record_details` | Rich per-record object for downstream module use. |
| `health_check_ids` | Map of logical health check keys to Route53 health check IDs. |
| `health_check_arns` | Map of logical health check keys to Route53 health check ARNs. |
| `health_check_details` | Rich per-health-check object for downstream module use. |

## Example Usage

```hcl
module "example" {
	source = "./modules/route53"

	default_zone_id    = "Z1234567890ABC"
	primary_record_key = "frontend_a"

	tags = {
		Project     = "shared-platform"
		Environment = "prod"
		ManagedBy   = "Terraform"
	}

	health_checks = {
		frontend_https = {
			type              = "HTTPS"
			fqdn              = "app.example.com"
			resource_path     = "/healthz"
			request_interval  = 30
			failure_threshold = 3
		}
	}

	records = {
		frontend_a = {
			name = "app.example.com"
			type = "A"
			alias = {
				name                   = "d111111abcdef8.cloudfront.net"
				zone_id                = "Z2FDTNDATAQYW2"
				evaluate_target_health = false
			}
			health_check_key = "frontend_https"
		}

		www = {
			name    = "www.app.example.com"
			type    = "CNAME"
			ttl     = 300
			records = ["app.example.com"]
		}
	}
}
```

## How It Works — Step-by-Step

1. Terraform reads the input variables and validates the configuration.
2. `locals.tf` normalizes the input so blank strings, defaults, and optional blocks are converted into a consistent internal shape.
3. `main.tf` check blocks verify important cross-object rules, such as valid `primary_record_key` values and valid health check references.
4. If `health_checks` is not empty, Terraform creates `aws_route53_health_check` resources first.
5. Terraform then creates `aws_route53_record` resources using the normalized record map.
6. Dynamic routing blocks are rendered only for records that actually use a given routing policy.
7. `outputs.tf` publishes simple maps and structured objects so other modules can consume the results.

## Understanding the Key Concepts

### `for_each`

`for_each` is used when one block should create many similar resources.

In this module:
- `for_each = local.normalized_health_checks` creates one health check per map entry.
- `for_each = local.normalized_records` creates one DNS record per map entry.

Important meanings:
- `each.key` is the logical name from the map, such as `frontend_a`.
- `each.value` is the full object for that entry.

This is safer than `count` because each resource keeps a stable logical identity.

### Dynamic Blocks

Dynamic blocks are used when nested configuration is optional.

In this module they are used for:
- `alias`
- `cidr_routing_policy`
- `failover_routing_policy`
- `geolocation_routing_policy`
- `geoproximity_routing_policy`
- `latency_routing_policy`
- `weighted_routing_policy`

They exist because a Route53 record can use only the blocks it needs.
When the `for_each` expression for a dynamic block is empty, Terraform renders nothing.
When the `for_each` expression contains one item, Terraform renders that nested block.

### Locals

Locals are helper values created inside the module.

This module uses locals to:
- trim whitespace
- apply default values
- convert empty strings to `null`
- resolve health check IDs from health check keys
- pick the record behind the top-level `fqdn` output

This keeps the resource blocks simpler and easier to read.

### Health Check Logic

The module supports two health check reference styles:
- direct `health_check_id` for existing AWS health checks
- `health_check_key` for health checks created inside the module

This is useful because teams can start with existing health checks and later move to module-managed checks without changing resource names.

### Outputs

Outputs are values that Terraform exposes after planning or applying.

This module provides:
- simple maps for quick lookups
- structured objects for downstream modules that need more context

For example, `record_details` is easier to consume than many separate outputs when another module needs several values for the same record.

## Common Issues

### `primary_record_key` does not match a record key

Cause:
- `primary_record_key` points to a key that does not exist in `records`

Fix:
- update `primary_record_key` so it matches one of the keys in the `records` map

### A record has no hosted zone ID

Cause:
- neither `record.zone_id` nor `default_zone_id` was provided

Fix:
- set `default_zone_id` for shared hosted zone usage, or set `zone_id` on the affected record

### `health_check_key` does not exist

Cause:
- a record or calculated health check references a key that is missing from `health_checks`

Fix:
- add the missing health check entry or correct the key spelling

### Failover records do not behave correctly

Cause:
- failover records require a health signal

Fix:
- use `health_check_id`, `health_check_key`, or an alias target with `evaluate_target_health = true`

### Invalid routing policy combinations

Cause:
- a record tries to use more than one routing policy at once

Fix:
- keep only one routing policy block per record set

## Best Practices

- Use `default_zone_id` when many records share the same hosted zone. This reduces repetition and mistakes.
- Prefer `health_check_key` over hard-coded `health_check_id` when health checks are managed by Terraform. This improves reuse across projects and environments.
- Use failover routing with health checks for critical services that need active-passive DNS behavior.
- Use alias records for AWS targets such as CloudFront because alias records work cleanly with AWS-managed DNS names.
- Keep record definitions grouped in one module call when they belong to one application boundary. This makes outputs and maintenance simpler.
- Keep health checks tagged even though records cannot be tagged. Tags help with operations, ownership, and cost tracking.