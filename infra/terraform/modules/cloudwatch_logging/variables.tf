variable "log_groups" {
  description = "Map of log groups to create"
  type = map(object({
    retention_in_days = number
  }))
}

variable "tags" {
  description = "Tags applied to all resources."
  type        = map(string)
  default     = {}
}
