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
