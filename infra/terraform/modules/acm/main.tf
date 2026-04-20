# ---------------------------------------------------------------------------
# main.tf
#
# This file contains the three AWS resources that together issue a valid,
# publicly-trusted TLS certificate:
#
#   1. aws_acm_certificate        — requests the certificate from ACM
#   2. aws_route53_record         — proves domain ownership via DNS
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
  # Explicitly route this resource through the aliased provider so it is
  # created in the correct region (see provider block above).
  provider = aws.certificate

  # The primary domain for the certificate.
  # This value is computed in locals.tf (primary_domain_name) and has
  # whitespace stripped.
  domain_name = local.primary_domain_name

  # Additional domains protected by the same certificate.
  # Also computed in locals.tf (subject_alternative_names), which removes any
  # duplicates and removes the primary domain if it was accidentally included.
  subject_alternative_names = local.subject_alternative_names

  # DNS validation is the only method used here.
  # Alternative: EMAIL, where ACM emails links to whois contacts.
  # DNS validation is preferred because:
  #   • It can be fully automated (no human clicks required).
  #   • The validation record only needs to be created once; future renewals
  #     are handled automatically while the record stays in place.
  validation_method = "DNS"

  # Propagate the caller's tags to this resource so the certificate appears
  # in cost reports and AWS Console filters alongside related resources.
  tags = var.tags

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
    # If any domain is missing a zone, the list local.missing_validation_zone_domains
    # will be non-empty and the condition evaluates to false.
    #
    # Only runs when create_route53_records is true because that is the only
    # case where zone IDs are needed.
    precondition {
      condition     = !var.create_route53_records || length(local.missing_validation_zone_domains) == 0
      error_message = "When create_route53_records is true, zone_id or validation_zone_ids must provide a hosted zone ID for every requested domain."
    }

    # Precondition 2 — external DNS validation safety check
    # When the caller disables Route53 management (create_route53_records =
    # false), they must either:
    #   (a) supply the already-created FQDNs via validation_record_fqdns, OR
    #   (b) accept that Terraform will not wait for issuance (wait_for_validation = false).
    # Without this check a plan would succeed but the apply would hang
    # indefinitely waiting for validation records that were never created.
    precondition {
      condition     = var.create_route53_records || length(var.validation_record_fqdns) > 0 || !var.wait_for_validation
      error_message = "When create_route53_records is false, provide validation_record_fqdns or set wait_for_validation to false."
    }
  }
}

# ---------------------------------------------------------------------------
# Resource: aws_route53_record
# ---------------------------------------------------------------------------
# After ACM creates the certificate request it provides a unique CNAME record
# value per domain.  Publishing this record in DNS proves to ACM that we
# control the domain.
#
# for_each explained:
#   for_each iterates over a map and creates one resource instance per entry.
#   In this case local.validation_records is a map keyed by domain name.
#   For a certificate with domain_name="app.example.com" and one SAN
#   "www.example.com", for_each creates two Route53 records — one for each.
#
#   Inside the resource block:
#     each.key   → the domain name (e.g. "app.example.com")
#     each.value → the object {name, record, type, zone_id} from the map
#
# When create_route53_records is false, local.validation_records is an empty
# map {} and no records are created at all.
resource "aws_route53_record" "this" {
  # One record per validated domain.
  for_each = local.validation_records

  # allow_overwrite = true lets Terraform update the record if it already
  # exists.  This is important when multiple related certificates share the
  # same CNAME record — the second apply would otherwise fail with a conflict.
  allow_overwrite = true

  # The subdomain label that ACM tells us to create.
  # Example: "_abc123def456.app.example.com"
  name = each.value.name

  # The CNAME value — the address ACM monitors for the challenge response.
  # Wrapped in a list because Route53 allows multiple values per record (for
  # round-robin), even though ACM only ever needs one.
  records = [each.value.record]

  # How long DNS resolvers cache this record.
  # 60 seconds (default) means ACM can detect the record quickly after it
  # is published.
  ttl = var.validation_record_ttl

  # ACM always uses CNAME for DNS validation.
  type = each.value.type

  # The hosted zone that contains this domain.
  # Comes from local.resolved_validation_zone_ids which respects per-domain
  # overrides (var.validation_zone_ids) with a fallback to var.zone_id.
  zone_id = each.value.zone_id
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
  count = var.wait_for_validation ? 1 : 0

  # Must use the same region as the certificate itself.
  provider = aws.certificate

  # The ARN of the certificate to watch.
  certificate_arn = aws_acm_certificate.this.arn

  # The complete list of FQDNs for which validation records exist.
  # ACM polls each FQDN until it sees the correct CNAME value.
  # Terraform waits for ACM to mark each one "validated" before this
  # resource is considered complete.
  # The local merges records created in this module with any external records
  # supplied via var.validation_record_fqdns.
  validation_record_fqdns = local.validation_record_fqdns
}