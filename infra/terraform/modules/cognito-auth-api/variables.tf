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

variable "google_client_id" {
  description = "Google OAuth client ID used by Cognito identity provider."
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth client secret used by Cognito identity provider."
  type        = string
  sensitive   = true
}
