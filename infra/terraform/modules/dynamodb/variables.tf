variable "table_name" {
  description = "Name of the DynamoDB table."
  type        = string
}

variable "billing_mode" {
  description = "Billing mode for the table. Valid values are PAY_PER_REQUEST or PROVISIONED."
  type        = string
  default     = "PAY_PER_REQUEST"

  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "billing_mode must be either PAY_PER_REQUEST or PROVISIONED."
  }
}

variable "hash_key" {
  description = "Partition key attribute name."
  type        = string
}

variable "range_key" {
  description = "Optional sort key attribute name."
  type        = string
  default     = null
}

variable "attributes" {
  description = "Attribute definitions for the DynamoDB table and its indexes."
  type = list(object({
    name = string
    type = string
  }))

  validation {
    condition     = alltrue([for attr in var.attributes : contains(["S", "N", "B"], attr.type)])
    error_message = "Each attribute type must be one of S, N, or B."
  }
}

variable "global_secondary_indexes" {
  description = "Optional list of global secondary indexes (GSIs)."
  type = list(object({
    name               = string
    hash_key           = string
    range_key          = optional(string)
    projection_type    = string
    non_key_attributes = optional(list(string), [])
    read_capacity      = optional(number)
    write_capacity     = optional(number)
  }))
  default = []

  validation {
    condition = alltrue([
      for gsi in var.global_secondary_indexes : contains(["ALL", "KEYS_ONLY", "INCLUDE"], gsi.projection_type)
    ])
    error_message = "Each global secondary index projection_type must be ALL, KEYS_ONLY, or INCLUDE."
  }

  validation {
    condition = alltrue([
      for gsi in var.global_secondary_indexes :
      gsi.projection_type != "INCLUDE" || length(try(gsi.non_key_attributes, [])) > 0
    ])
    error_message = "Each global secondary index with projection_type INCLUDE must define non_key_attributes."
  }

  validation {
    condition = var.billing_mode != "PROVISIONED" || alltrue([
      for gsi in var.global_secondary_indexes :
      try(gsi.read_capacity, null) != null && try(gsi.write_capacity, null) != null
    ])
    error_message = "Each global secondary index must define read_capacity and write_capacity when billing_mode is PROVISIONED."
  }
}

variable "ttl_enabled" {
  description = "Whether to enable TTL on the table."
  type        = bool
  default     = false
}

variable "ttl_attribute_name" {
  description = "TTL attribute name. Required when ttl_enabled is true."
  type        = string
  default     = null

  validation {
    condition     = !var.ttl_enabled || (var.ttl_attribute_name != null && trimspace(var.ttl_attribute_name) != "")
    error_message = "ttl_attribute_name must be set when ttl_enabled is true."
  }
}

variable "point_in_time_recovery_enabled" {
  description = "Whether to enable point-in-time recovery."
  type        = bool
  default     = true
}

variable "server_side_encryption_enabled" {
  description = "Whether to enable server-side encryption."
  type        = bool
  default     = true
}

variable "read_capacity" {
  description = "Read capacity units for PROVISIONED mode."
  type        = number
  default     = 5

  validation {
    condition     = var.billing_mode != "PROVISIONED" || var.read_capacity > 0
    error_message = "read_capacity must be greater than 0 when billing_mode is PROVISIONED."
  }
}

variable "write_capacity" {
  description = "Write capacity units for PROVISIONED mode."
  type        = number
  default     = 5

  validation {
    condition     = var.billing_mode != "PROVISIONED" || var.write_capacity > 0
    error_message = "write_capacity must be greater than 0 when billing_mode is PROVISIONED."
  }
}

variable "tags" {
  description = "Tags applied to the table."
  type        = map(string)
  default     = {}
}
