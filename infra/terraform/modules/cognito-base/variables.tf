variable "project_name" {
  description = "Project name used as the resource naming prefix."
  type        = string
}

variable "environment" {
  description = "Environment name used for naming and tagging (for example dev, prod)."
  type        = string
}

variable "callback_urls" {
  description = "OAuth callback URLs used by Cognito after successful sign-in."
  type        = list(string)
}

variable "logout_urls" {
  description = "OAuth logout redirect URLs used by Cognito sign-out flow."
  type        = list(string)
}

variable "supported_identity_providers" {
  description = "Identity providers enabled on the user pool client."
  type        = list(string)
  default     = ["COGNITO"]
}

variable "verification_message_template" {
  description = "Optional Cognito verification message template configuration for signup verification emails or SMS."
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
  description = "Optional token lifetime configuration for Cognito app client."
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
