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
