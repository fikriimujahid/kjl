# ---------------------------------------------------------------------------
# outputs.tf
#
# Outputs are values that this module "publishes" for its caller to consume.
# They are the public API of the module.
#
# A caller accesses an output like this:
#   module.<module_label>.<output_name>
# Example:
#   module.frontend_certificate.certificate_arn
#
# Only the values that dependent modules actually need are exposed here.
# Internal locals that are only used within this module are NOT output.
# ---------------------------------------------------------------------------

# The most important output: the ARN (Amazon Resource Name) of the issued
# certificate.  CloudFront distributions, ALBs, and API Gateway stages all
# need this value to enable HTTPS.
#
# When wait_for_validation is true (default), Terraform resolves this from
# aws_acm_certificate_validation, which only becomes available after ACM has
# confirmed domain ownership and issued the certificate.
# When wait_for_validation is false, the raw certificate ARN is returned
# immediately — callers must be aware the certificate may still be PENDING.
output "certificate_arn" {
  description = "ARN of the ACM certificate. When wait_for_validation is true, this output waits for issuance."
  value = try(trimspace(var.existing_certificate_arn), "") == "" ? (
    var.wait_for_validation ? aws_acm_certificate_validation.this[0].certificate_arn : aws_acm_certificate.this[0].arn
  ) : var.existing_certificate_arn
}

# The primary domain name exactly as stored inside the certificate.
# Useful for double-checking that the certificate covers the expected domain,
# or for displaying in a dashboard / notification.
output "certificate_domain_name" {
  description = "Primary domain name attached to the ACM certificate."
  value       = try(trimspace(var.existing_certificate_arn), "") == "" ? aws_acm_certificate.this[0].domain_name : null
}

# The current lifecycle state of the certificate.
# Important values:
#   PENDING_VALIDATION — waiting for DNS validation records to be detected
#   ISSUED             — certificate is live and can be used
#   INACTIVE           — not currently associated with any service
#   FAILED             — issuance failed; check the domain_validation_options
# Reading this output in the console/CI can save time debugging stuck deploys.
output "certificate_status" {
  description = "Current ACM certificate status."
  value       = try(trimspace(var.existing_certificate_arn), "") == "" ? aws_acm_certificate.this[0].status : null
}

# The list of Subject Alternative Names as ACM stored them on the certificate.
# Useful for verification — confirms the certificate actually covers all the
# domains the caller requested, including any that were deduplicated.
output "subject_alternative_names" {
  description = "Deduplicated SAN list attached to the ACM certificate."
  value       = try(trimspace(var.existing_certificate_arn), "") == "" ? aws_acm_certificate.this[0].subject_alternative_names : []
}

# The FQDNs of the DNS validation records used to prove domain ownership.
# When DNS is managed here, these are the FQDNs of the Route53 records
# created through module.route53_validation.
# When DNS is external, these include the values supplied via
# var.validation_record_fqdns.
# A downstream module that manages its own certificate rotation can feed
# this list back into another aws_acm_certificate_validation resource.
output "validation_record_fqdns" {
  description = "FQDNs used for ACM DNS validation."
  value = try(trimspace(var.existing_certificate_arn), "") == "" ? distinct(concat(
    values(module.route53_validation.record_fqdns),
    var.validation_record_fqdns
  )) : []
}

# A structured map of everything a caller needs to create validation records
# in an external DNS system (e.g. Cloudflare, Azure DNS).
#
# Structure:
#   {
#     "app.example.com" = {
#       record_name  = "_abc123.app.example.com"
#       record_type  = "CNAME"
#       record_value = "_xyz789.acm-validations.aws."
#     }
#     "www.example.com" = { … }
#   }
#
# Usage in an external DNS module:
#   for_each = module.acm.validation_options
#   name     = each.value.record_name
#   type     = each.value.record_type
#   value    = each.value.record_value
output "validation_options" {
  description = "DNS validation record details returned by ACM, keyed by domain name."
  value = try(trimspace(var.existing_certificate_arn), "") == "" ? {
    for dvo in aws_acm_certificate.this[0].domain_validation_options :
    dvo.domain_name => {
      record_name  = dvo.resource_record_name
      record_type  = dvo.resource_record_type
      record_value = dvo.resource_record_value
    }
  } : {}
}