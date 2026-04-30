# DynamoDB Terraform Module

Reusable Terraform module to provision a single DynamoDB table with optional GSI, TTL, point-in-time recovery, and server-side encryption.

This module is environment-agnostic and designed to be reused by any environment root under `infra/terraform/environments/*`.

## Features

- Supports `PAY_PER_REQUEST` and `PROVISIONED` billing modes
- Supports hash key and optional range key
- Supports custom attribute definitions
- Supports optional Global Secondary Indexes (GSI)
- Supports optional TTL configuration
- Supports point-in-time recovery (PITR)
- Supports server-side encryption (SSE)
- Merges caller-provided tags with module-specific tags

## Input Variables

| Name | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `table_name` | `string` | Yes | n/a | Name of the DynamoDB table. |
| `billing_mode` | `string` | No | `PAY_PER_REQUEST` | Billing mode: `PAY_PER_REQUEST` or `PROVISIONED`. |
| `hash_key` | `string` | Yes | n/a | Partition key attribute name. |
| `range_key` | `string` | No | `null` | Sort key attribute name. |
| `attributes` | `list(object({ name = string, type = string }))` | Yes | n/a | Attribute definitions used by table and indexes. Attribute type must be `S`, `N`, or `B`. |
| `global_secondary_indexes` | `list(object(...))` | No | `[]` | Optional list of GSI definitions. |
| `ttl_enabled` | `bool` | No | `false` | Enables TTL when `true`. |
| `ttl_attribute_name` | `string` | No | `null` | TTL attribute name. Required if `ttl_enabled = true`. |
| `point_in_time_recovery_enabled` | `bool` | No | `true` | Enables PITR backup recovery. |
| `server_side_encryption_enabled` | `bool` | No | `true` | Enables server-side encryption. |
| `read_capacity` | `number` | No | `5` | Read capacity units when `billing_mode = PROVISIONED`. |
| `write_capacity` | `number` | No | `5` | Write capacity units when `billing_mode = PROVISIONED`. |
| `tags` | `map(string)` | No | `{}` | Tags applied to the table. |

### GSI Object Schema

Each item in `global_secondary_indexes` supports:

- `name` (string)
- `hash_key` (string)
- `range_key` (optional string)
- `projection_type` (string: `ALL`, `KEYS_ONLY`, `INCLUDE`)
- `non_key_attributes` (optional list(string), required when `projection_type = INCLUDE`)
- `read_capacity` (optional number, required when table `billing_mode = PROVISIONED`)
- `write_capacity` (optional number, required when table `billing_mode = PROVISIONED`)

## Output Variables

| Name | Description |
| --- | --- |
| `table_name` | Name of the DynamoDB table. |
| `table_arn` | ARN of the DynamoDB table. |
| `table_id` | ID of the DynamoDB table. |

## Example Usage

```hcl
module "learning_content_table" {
  source = "../../modules/dynamodb"

  table_name   = "learning-content"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    }
  ]

  global_secondary_indexes       = []
  ttl_enabled                    = false
  ttl_attribute_name             = null
  point_in_time_recovery_enabled = true
  server_side_encryption_enabled = true

  tags = var.tags
}
```

## Notes

- TTL block is only created when `ttl_enabled = true`.
- If TTL is enabled, `ttl_attribute_name` must be provided.
- For `PAY_PER_REQUEST`, read/write capacities are not used.
- For `PROVISIONED`, table `read_capacity` and `write_capacity` are used, and each GSI also needs `read_capacity` and `write_capacity`.
