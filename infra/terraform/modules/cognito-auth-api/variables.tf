variable "project_name" {
  description = "Project name used as the resource naming prefix."
  type        = string
}

variable "environment" {
  description = "Environment name used for naming and tagging."
  type        = string
}

variable "callback_urls" {
  description = "OAuth callback URLs used by Cognito after sign-in."
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth logout redirect URLs used by Cognito sign-out."
  type        = list(string)
}

variable "user_pool_schema_attributes" {
  description = "Cognito user pool schema attributes passed to the base module."
  type = list(object({
    name                     = string
    attribute_data_type      = string
    developer_only_attribute = optional(bool, false)
    mutable                  = optional(bool, true)
    required                 = optional(bool, false)
    string_attribute_constraints = optional(object({
      min_length = optional(number)
      max_length = optional(number)
    }))
    number_attribute_constraints = optional(object({
      min_value = optional(number)
      max_value = optional(number)
    }))
  }))
  default = [
    {
      name                = "email"
      attribute_data_type = "String"
      required            = true
      mutable             = true
      string_attribute_constraints = {
        min_length = 5
        max_length = 2048
      }
    }
  ]
}

variable "enabled_identity_providers" {
  description = "Identity providers enabled on the Cognito app client. Supported values: COGNITO and Google."
  type        = list(string)
  default     = ["COGNITO", "Google"]

  validation {
    condition = alltrue([
      for provider in var.enabled_identity_providers :
      contains(["COGNITO", "Google"], provider)
    ])
    error_message = "enabled_identity_providers can contain only COGNITO and Google."
  }

  validation {
    condition     = contains(var.enabled_identity_providers, "COGNITO")
    error_message = "enabled_identity_providers must include COGNITO."
  }
}

variable "google_client_id" {
  description = "Google OAuth client ID used by Cognito identity provider."
  type        = string
  default     = null

  validation {
    condition     = !contains(var.enabled_identity_providers, "Google") || (var.google_client_id != null && trimspace(var.google_client_id) != "")
    error_message = "google_client_id is required when enabled_identity_providers includes Google."
  }
}

variable "google_client_secret" {
  description = "Google OAuth client secret used by Cognito identity provider."
  type        = string
  sensitive   = true
  default     = null

  validation {
    condition     = !contains(var.enabled_identity_providers, "Google") || (var.google_client_secret != null && trimspace(var.google_client_secret) != "")
    error_message = "google_client_secret is required when enabled_identity_providers includes Google."
  }
}

variable "verification_message_template" {
  description = "Optional verification message template passed to the underlying Cognito user pool."
  type = object({
    default_email_option  = optional(string)
    email_message         = optional(string)
    email_message_by_link = optional(string)
    email_subject         = optional(string)
    email_subject_by_link = optional(string)
    sms_message           = optional(string)
  })
  default = null
}

variable "token_validity" {
  description = "Optional token lifetime configuration for Cognito app clients."
  type = object({
    access_token_validity  = optional(number)
    id_token_validity      = optional(number)
    refresh_token_validity = optional(number)
    token_validity_units = optional(object({
      access_token  = optional(string, "hours")
      id_token      = optional(string, "hours")
      refresh_token = optional(string, "days")
    }), {})
  })
  default = {}

  validation {
    condition = alltrue([
      for value in [
        try(var.token_validity.access_token_validity, null),
        try(var.token_validity.id_token_validity, null),
        try(var.token_validity.refresh_token_validity, null)
      ] : value == null || value > 0
    ])
    error_message = "Token validity values must be greater than 0 when provided."
  }

  validation {
    condition = alltrue([
      for unit in [
        try(var.token_validity.token_validity_units.access_token, "hours"),
        try(var.token_validity.token_validity_units.id_token, "hours"),
        try(var.token_validity.token_validity_units.refresh_token, "days")
      ] : contains(["seconds", "minutes", "hours", "days"], unit)
    ])
    error_message = "Token validity units must be one of: seconds, minutes, hours, days."
  }
}
