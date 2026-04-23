# ---------------------------------------------------------------------------
# main.tf
#
# This file contains the three AWS resources that together issue a valid,
# publicly-trusted TLS certificate:
#
#   1. aws_acm_certificate        — requests the certificate from ACM
#   2. module.route53_validation  — proves domain ownership via DNS
#   3. aws_acm_certificate_validation — waits for ACM to confirm issuance
#
# Read in this order to understand the full flow.
# ---------------------------------------------------------------------------

# ---------------------------------------------------------------------------
# Provider alias
# ---------------------------------------------------------------------------
# Terraform needs a separate "view" of AWS for the certificate region because
# ACM certificates MUST be created in us-east-1 for CloudFront, but the rest
# of your infrastructure may live in a different region (e.g. ap-southeast-1).
#
# "alias" gives this provider block a secondary name ("certificate") so it
# can be referenced explicitly by the resources in this file with:
#   provider = aws.certificate
#
# The caller's root module must pass this aliased provider when instantiating
# the module.  This provider block cannot be inherited automatically by child
# modules — it must be declared explicitly.
provider "aws" {
  # The alias distinguishes this block from any other aws provider blocks
  # that may exist in the same module graph.
  alias = "certificate"

  # var.certificate_region defaults to "us-east-1".
  # For CloudFront certificates that value must stay as-is.
  # For regional certificates (ALB, API Gateway) change it to match the
  # service region.
  region = var.certificate_region
}

# ---------------------------------------------------------------------------
# Resource: aws_acm_certificate
# ---------------------------------------------------------------------------
# This resource sends the certificate request to ACM.
# After creation it is in "PENDING_VALIDATION" status.
# ACM will not issue the certificate until it sees the validation DNS record.
resource "aws_acm_certificate" "this" {
  count = try(trimspace(var.existing_certificate_arn), "") == "" ? 1 : 0

  provider                  = aws.certificate
  domain_name               = trimspace(var.domain_name)
  subject_alternative_names = var.subject_alternative_names
  validation_method         = "DNS"
  tags                      = var.tags

  # options block — certificate-level settings
  options {
    # Certificate Transparency logs are public records of every certificate
    # issued.  Browsers require this to be enabled; without it, Chrome and
    # Firefox show a security warning to users.
    # The ternary converts the boolean variable into the string that ACM expects.
    certificate_transparency_logging_preference = var.certificate_transparency_logging_enabled ? "ENABLED" : "DISABLED"
  }

  # The cryptographic algorithm for the key pair.
  # RSA_2048 is the safe default.  EC algorithms produce smaller keys and
  # are faster to verify but require modern client support.
  key_algorithm = var.key_algorithm

  # lifecycle block — controls how Terraform handles updates and replacement
  lifecycle {
    # ACM certificates cannot be modified in-place; any change creates a new
    # certificate.  "create_before_destroy = true" means Terraform provisions
    # the replacement first, then moves traffic (in the dependent resources),
    # and only then deletes the old certificate.  Without this flag there
    # would be a gap where no valid certificate exists.
    create_before_destroy = true

    # Precondition 1 — zone coverage check
    # A precondition is evaluated before Terraform creates or modifies this
    # resource.  If the condition is false, Terraform prints error_message and
    # stops the apply.
    #
    # This check ensures every domain on the certificate has a Route53 zone
    # assigned to it (via var.zone_id or var.validation_zone_ids).
    # If any domain is missing a zone, the derived missing domain list
    # will be non-empty and the condition evaluates to false.
    #
    # This runs when existing_certificate_arn is not provided, because DNS
    # validation records are managed by this module only in that mode.
    precondition {
      condition = try(trimspace(var.existing_certificate_arn), "") != "" || length([
        for domain_name, zone_id in {
          for domain_name in distinct(compact(concat(
            [trimspace(var.domain_name)],
            [for san in var.subject_alternative_names : trimspace(san)]
          ))) :
          domain_name => lookup(var.validation_zone_ids, domain_name, var.zone_id)
          if try(trimspace(var.existing_certificate_arn), "") == ""
        } : domain_name
        if zone_id == null
      ]) == 0
      error_message = "When existing_certificate_arn is not set, zone_id or validation_zone_ids must provide a hosted zone ID for every requested domain."
    }
  }
}

# ---------------------------------------------------------------------------
# Module: route53_validation
# ---------------------------------------------------------------------------
# After ACM creates the certificate request it provides a unique CNAME record
# value per domain.  Publishing this record in DNS proves to ACM that we
# control the domain.
#
# When existing_certificate_arn is set, the records map is empty and the
# route53 module creates no records.
module "route53_validation" {
  source = "../route53"

  records = try(trimspace(var.existing_certificate_arn), "") == "" ? {
    for dvo in aws_acm_certificate.this[0].domain_validation_options :
    dvo.domain_name => {
      allow_overwrite = true
      name            = dvo.resource_record_name
      type            = dvo.resource_record_type
      ttl             = var.validation_record_ttl
      records         = [dvo.resource_record_value]
      zone_id         = lookup(var.validation_zone_ids, dvo.domain_name, var.zone_id)
    }
  } : {}
}

# ---------------------------------------------------------------------------
# Resource: aws_acm_certificate_validation
# ---------------------------------------------------------------------------
# This resource does not create any AWS infrastructure.
# Its only purpose is to make Terraform WAIT until ACM reports the
# certificate status as "ISSUED".
#
# Why is this needed?
#   Without it, the module outputs the certificate ARN immediately after the
#   certificate is created.  A CloudFront distribution that uses that ARN
#   might be configured before the certificate is actually issued, causing the
#   distribution creation to fail.
#
# count explained:
#   count = 0 means "create zero instances of this resource" — it is skipped.
#   count = 1 means "create one instance".
#   Here: count = 1 when wait_for_validation is true, 0 otherwise.
#   This replaces what would otherwise need to be separate module variants.
resource "aws_acm_certificate_validation" "this" {
  # count controls whether this resource exists at all.
  # When wait_for_validation is false, Terraform creates 0 instances and
  # returns the certificate ARN without waiting.
  count = try(trimspace(var.existing_certificate_arn), "") == "" && var.wait_for_validation ? 1 : 0

  # Must use the same region as the certificate itself.
  provider = aws.certificate

  # The ARN of the certificate to watch.
  certificate_arn = aws_acm_certificate.this[0].arn

  # The complete list of FQDNs for which validation records exist.
  # ACM polls each FQDN until it sees the correct CNAME value.
  # Terraform waits for ACM to mark each one "validated" before this
  # resource is considered complete.
  # This expression merges records created in this module with any external records
  # supplied via var.validation_record_fqdns.
  validation_record_fqdns = distinct(concat(
    values(module.route53_validation.record_fqdns),
    var.validation_record_fqdns
  ))
}