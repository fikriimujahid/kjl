# ---------------------------------------------------------------------------
# variables.tf
#
# All configurable inputs for this module live here.
# Keeping every variable in one file makes it easy for a caller to see at a
# glance what the module expects and what they can customise.
#
# Terraform evaluates validation blocks before it creates any resource, so
# bad values are caught immediately, before any API call is made.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# REQUIRED — must be provided by the caller, no default exists
# ---------------------------------------------------------------------------

# The primary domain name that will appear on the certificate.
# Examples: "app.example.com", "*.example.com" (wildcard), "example.com".
# ACM uses this as the "Common Name" of the certificate.
variable "domain_name" {
  description = "Primary domain name for the ACM certificate."
  type        = string

  # Guard against typos such as "app.example" (missing TLD) or an empty string.
  # The regex allows an optional leading "*." for wildcard certificates, then
  # requires at least one subdomain label and a TLD of two or more letters.
  validation {
    condition     = can(regex("^(\\*\\.)?([A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$", trimspace(var.domain_name)))
    error_message = "domain_name must be a valid DNS name, such as app.example.com or *.example.com."
  }
}

# ---------------------------------------------------------------------------
# OPTIONAL — sensible defaults are provided
# ---------------------------------------------------------------------------

# Subject Alternative Names extend the certificate to cover more hostnames.
# A single ACM certificate can protect up to 10 domain names (1 primary + 9 SANs).
# Example: ["www.example.com", "api.example.com"]
# Leave empty ([]) if the certificate only needs to cover domain_name.
variable "subject_alternative_names" {
  description = "Optional SANs to include on the certificate."
  type        = list(string)
  default     = []

  # Duplicate SANs would be silently collapsed by AWS, but it is better to
  # catch them early so the caller knows their input is wrong.
  validation {
    condition = length(var.subject_alternative_names) == length(distinct([
      for domain_name in var.subject_alternative_names : trimspace(domain_name)
    ]))
    error_message = "subject_alternative_names must not contain duplicates."
  }

  # Each entry must be a real DNS name — same rules as domain_name.
  validation {
    condition = alltrue([
      for domain_name in var.subject_alternative_names :
      can(regex("^(\\*\\.)?([A-Za-z0-9-]+\\.)+[A-Za-z]{2,}$", trimspace(domain_name)))
    ])
    error_message = "Each subject_alternative_names entry must be a valid DNS name."
  }
}

# The Route53 hosted zone that owns domain_name.
# This module creates DNS TXT/CNAME validation records inside this zone so
# that ACM can confirm you control the domain.
# Format: "Z1234567890ABCDEFGHIJK"
# Leave null only when create_route53_records is false (external DNS workflow).
variable "zone_id" {
  description = "Default Route53 hosted zone ID used for DNS validation records."
  type        = string
  default     = null

  # Route53 zone IDs always start with "Z" followed by uppercase letters and digits.
  # An obviously wrong value is caught here rather than with a confusing AWS API error.
  validation {
    condition     = var.zone_id == null || can(regex("^Z[0-9A-Z]+$", var.zone_id))
    error_message = "zone_id must be a valid Route53 hosted zone ID when provided."
  }
}

# Advanced: override the hosted zone per SAN.
# Use this when SANs live in different Route53 zones from domain_name.
# Example:
#   validation_zone_ids = {
#     "other.example.net" = "Z0987654321XYZ"
#   }
# Any SAN not listed here falls back to var.zone_id.
variable "validation_zone_ids" {
  description = "Optional per-domain Route53 hosted zone IDs keyed by domain name."
  type        = map(string)
  default     = {}

  # Each value must be a valid zone ID.
  validation {
    condition = alltrue([
      for zone_id in values(var.validation_zone_ids) :
      can(regex("^Z[0-9A-Z]+$", zone_id))
    ])
    error_message = "validation_zone_ids values must be valid Route53 hosted zone IDs."
  }
}

# When true (default), this module creates the Route53 validation records
# automatically. The only time you set this to false is when DNS is managed
# outside of Terraform — for example, in a third-party DNS provider or a
# separate Terraform root module that you do not want to touch.
variable "create_route53_records" {
  description = "If true, create Route53 DNS validation records inside this module."
  type        = bool
  default     = true
}

# Used ONLY when create_route53_records is false.
# Provide the list of FQDN strings that the external DNS system has already
# created. ACM checks these values to confirm domain ownership.
# Example: ["_abc123.app.example.com"]
variable "validation_record_fqdns" {
  description = "External validation record FQDNs to use when DNS records are managed outside this module."
  type        = list(string)
  default     = []

  # An empty string in this list would confuse ACM; catch it here.
  validation {
    condition = alltrue([
      for fqdn in var.validation_record_fqdns : trimspace(fqdn) != ""
    ])
    error_message = "validation_record_fqdns must not contain empty values."
  }
}

# How long (in seconds) the DNS validation record stays in the cache of
# resolvers worldwide.  60 seconds is the lowest value Route53 will accept.
# A lower TTL means ACM confirms ownership faster after the record is created,
# but generates slightly more DNS query traffic.
variable "validation_record_ttl" {
  description = "TTL for DNS validation records created by this module."
  type        = number
  default     = 60

  # Route53 enforces a minimum of 60 seconds and a maximum of 86400 (24 hours).
  validation {
    condition     = var.validation_record_ttl >= 60 && var.validation_record_ttl <= 86400
    error_message = "validation_record_ttl must be between 60 and 86400 seconds."
  }
}

# When true (default), Terraform waits here until ACM reports the certificate
# as ISSUED before continuing to the next step in your plan.
# This makes the rest of your apply predictable — for example, a CloudFront
# distribution that depends on the certificate ARN will not be created with a
# pending-validation certificate.
# Set to false only in advanced pipelines where you want to decouple
# certificate issuance from distribution creation.
variable "wait_for_validation" {
  description = "If true, wait for ACM validation to complete before finishing apply."
  type        = bool
  default     = true
}

# ACM certificates used by CloudFront MUST exist in us-east-1 (AWS global
# region) regardless of where CloudFront edges and your application live.
# For regional services (ALB, API Gateway) you would set this to match the
# service region — for example, "ap-southeast-1".
variable "certificate_region" {
  description = "AWS region in which to request the ACM certificate. Use us-east-1 for CloudFront certificates."
  type        = string
  default     = "us-east-1"

  # A valid region name looks like "us-east-1", "ap-southeast-1", etc.
  # The regex matches the standard AWS pattern: two lowercase letters, a
  # direction word, and a single digit.
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", var.certificate_region))
    error_message = "certificate_region must be a valid AWS region identifier, such as us-east-1."
  }
}

# The cryptographic algorithm used to generate the certificate's key pair.
# RSA_2048 is the AWS-recommended default and is compatible with all clients.
# EC (Elliptic Curve) certificates are smaller and faster but require a client
# that supports ECC — most modern browsers do.
# RSA_1024 is deprecated and should be avoided for new certificates.
variable "key_algorithm" {
  description = "Key algorithm for the ACM certificate."
  type        = string
  default     = "RSA_2048"

  # Allow only the algorithms that ACM actually supports for public certificates.
  # Any other string would be rejected by AWS; this validation gives a clearer
  # error message than the raw API response.
  validation {
    condition = contains([
      "RSA_1024",
      "RSA_2048",
      "RSA_3072",
      "RSA_4096",
      "EC_prime256v1",
      "EC_secp384r1",
      "EC_secp521r1"
    ], var.key_algorithm)
    error_message = "key_algorithm must be a supported ACM public certificate key algorithm."
  }
}

# Certificate Transparency (CT) is a public log of every certificate ever
# issued. It was introduced to detect mis-issuance.  Most browsers require
# certificates to be logged here or they show a warning to users.
# Keep this enabled (default) unless you have a specific compliance reason
# to opt out — opting out itself raises security questions.
variable "certificate_transparency_logging_enabled" {
  description = "Enable certificate transparency logging for the ACM certificate."
  type        = bool
  default     = true
}

# Tags are key-value metadata that AWS attaches to resources.
# They are used for cost allocation, access control, and filtering in the
# AWS Console.  Pass at minimum {"Project", "Environment", "ManagedBy"}.
# Example:
#   tags = {
#     Project     = "my-app"
#     Environment = "prod"
#     ManagedBy   = "Terraform"
#   }
variable "tags" {
  description = "Tags applied to ACM and Route53 resources created by this module."
  type        = map(string)
  default     = {}
}