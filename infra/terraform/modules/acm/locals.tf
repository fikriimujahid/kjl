# ---------------------------------------------------------------------------
# locals.tf
#
# "locals" are computed values that exist only inside this module.
# They are recalculated every time Terraform evaluates the configuration.
# Think of them as private helper variables — they tidy up repeated
# expressions so main.tf stays short and readable.
#
# Why not just inline the logic in main.tf?
#   • The same derived value is often needed in multiple places.
#   • Putting the derivation here keeps each step easy to test mentally.
#   • A descriptive local name tells the reader what the value represents.
# ---------------------------------------------------------------------------

locals {
  # -------------------------------------------------------------------------
  # primary_domain_name
  # -------------------------------------------------------------------------
  # trimspace() removes any accidental leading or trailing whitespace from
  # var.domain_name before it is used anywhere.  This prevents subtle bugs
  # where "app.example.com " (with a trailing space) would be treated as a
  # different domain from "app.example.com".
  primary_domain_name = trimspace(var.domain_name)

  # -------------------------------------------------------------------------
  # requested_domain_names
  # -------------------------------------------------------------------------
  # Build a deduplicated list of every domain the certificate must cover.
  # This merges the primary domain and all SANs into one list so that other
  # locals can iterate over all domains uniformly.
  #
  # Step-by-step breakdown:
  #   1. Start with [local.primary_domain_name]   — a list with 1 element.
  #   2. concat(…, [for san in … : trimspace(san)]) — append every SAN after
  #      stripping whitespace from each one.
  #   3. compact(…) — removes any empty strings (defensive; shouldn't happen
  #      after validation, but compact is cheap protection).
  #   4. distinct(…) — removes duplicates.  If someone passes domain_name as
  #      a SAN as well, it appears only once in this list.
  requested_domain_names = distinct(compact(concat(
    [local.primary_domain_name],
    [for san in var.subject_alternative_names : trimspace(san)]
  )))

  # -------------------------------------------------------------------------
  # subject_alternative_names
  # -------------------------------------------------------------------------
  # ACM expects domain_name and subject_alternative_names to be separate
  # fields.  This local rebuilds the SAN list by removing the primary domain
  # from requested_domain_names so we never accidentally put the primary
  # domain in the SAN field, which would confuse ACM.
  #
  # for … if condition syntax:
  #   "for domain_name in list : domain_name if <keep condition>"
  #   Only items that pass the condition are included in the output.
  subject_alternative_names = [
    for domain_name in local.requested_domain_names : domain_name
    if domain_name != local.primary_domain_name
  ]

  # -------------------------------------------------------------------------
  # resolved_validation_zone_ids
  # -------------------------------------------------------------------------
  # ACM DNS validation requires a CNAME record inside the Route53 hosted zone
  # that is authoritative for each domain on the certificate.
  # When all domains live in the same zone, var.zone_id is enough.
  # When SANs live in different zones, var.validation_zone_ids provides
  # per-domain overrides.
  #
  # This local produces a map: domain → zone_id, for every domain that needs
  # a validation record.  The "if var.create_route53_records" guard means the
  # map is empty ({}) when Route53 management is disabled — there is nothing
  # to look up.
  #
  # How lookup() works:
  #   lookup(map, key, default)
  #   • Searches var.validation_zone_ids for this domain.
  #   • If found, returns that zone ID (override).
  #   • If not found, returns var.zone_id (the fallback default).
  resolved_validation_zone_ids = {
    for domain_name in local.requested_domain_names :
    domain_name => lookup(var.validation_zone_ids, domain_name, var.zone_id)
    if var.create_route53_records
  }

  # -------------------------------------------------------------------------
  # missing_validation_zone_domains
  # -------------------------------------------------------------------------
  # Safety check: collect any domains for which neither var.zone_id nor
  # var.validation_zone_ids supplied a zone.  Those would have null as their
  # zone_id in resolved_validation_zone_ids, which would cause a cryptic
  # apply error deep inside aws_route53_record.
  #
  # This list is consumed by the lifecycle precondition in main.tf.  If its
  # length is > 0, Terraform aborts with a friendly error before touching AWS.
  missing_validation_zone_domains = [
    for domain_name, zone_id in local.resolved_validation_zone_ids : domain_name
    if zone_id == null
  ]

  # -------------------------------------------------------------------------
  # validation_records
  # -------------------------------------------------------------------------
  # After AWS creates the ACM certificate, the resource exposes
  # "domain_validation_options" — one entry per domain/SAN.  Each entry
  # contains the exact DNS record (name, value, type) that ACM needs to see
  # published in Route53 before it will issue the certificate.
  #
  # This local reshapes that raw list into a map so it can be used with
  # for_each in aws_route53_record (for_each requires a map or set, not a list).
  #
  # Conditional expression:
  #   condition ? value_if_true : value_if_false
  #   When create_route53_records is false the map is empty and no Route53
  #   records are created.
  #
  # Each entry in the resulting map has four fields:
  #   name    — the subdomain label ACM wants (e.g. "_abc123.app.example.com")
  #   record  — the CNAME value to point it to (ACM's validation server)
  #   type    — always "CNAME" for DNS validation
  #   zone_id — the Route53 zone this record belongs to (from resolved_validation_zone_ids)
  validation_records = var.create_route53_records ? {
    for dvo in aws_acm_certificate.this.domain_validation_options :
    dvo.domain_name => {
      name    = dvo.resource_record_name
      record  = dvo.resource_record_value
      type    = dvo.resource_record_type
      zone_id = local.resolved_validation_zone_ids[dvo.domain_name]
    }
  } : {}

  # -------------------------------------------------------------------------
  # validation_record_fqdns
  # -------------------------------------------------------------------------
  # aws_acm_certificate_validation needs the full FQDN of every validation
  # record that has been created (by Route53 or externally).  This merges:
  #
  #   • FQDNs of the Route53 records created by this module
  #     (empty when create_route53_records is false)
  #   • FQDNs supplied externally via var.validation_record_fqdns
  #     (used in the external-DNS workflow)
  #
  # distinct() removes duplicates in case both sources reference the same record.
  validation_record_fqdns = distinct(concat(
    [for record in aws_route53_record.this : record.fqdn],
    var.validation_record_fqdns
  ))

  # -------------------------------------------------------------------------
  # certificate_arn
  # -------------------------------------------------------------------------
  # Dependent modules (e.g. CloudFront) need the certificate ARN.
  # There are two possible sources depending on whether we waited for issuance:
  #
  #   wait_for_validation = true  → use aws_acm_certificate_validation.this[0].certificate_arn
  #     This ARN is only available after ACM confirms the certificate is ISSUED.
  #     It is the same as the raw certificate ARN but reading from the
  #     validation resource forces Terraform to wait.
  #
  #   wait_for_validation = false → use aws_acm_certificate.this.arn
  #     The certificate ARN is known as soon as the resource is created
  #     (status = PENDING_VALIDATION).  The caller accepts the risk that the
  #     certificate may not yet be usable.
  certificate_arn = var.wait_for_validation ? aws_acm_certificate_validation.this[0].certificate_arn : aws_acm_certificate.this.arn

  # -------------------------------------------------------------------------
  # validation_options
  # -------------------------------------------------------------------------
  # A structured output that tells callers exactly which DNS records ACM
  # needs.  This is useful when the caller manages DNS externally and needs
  # to know what records to create.
  #
  # The map is keyed by domain name so callers can look up a specific domain:
  #   module.acm.validation_options["app.example.com"].record_name
  validation_options = {
    for dvo in aws_acm_certificate.this.domain_validation_options :
    dvo.domain_name => {
      record_name  = dvo.resource_record_name
      record_type  = dvo.resource_record_type
      record_value = dvo.resource_record_value
    }
  }
}