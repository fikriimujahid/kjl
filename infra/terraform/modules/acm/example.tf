/*
Example usage for a production-style CloudFront certificate.

module "frontend_certificate" {
  source = "./modules/acm"

  domain_name = "app.example.com"

  subject_alternative_names = [
    "www.app.example.com",
    "static.example.com"
  ]

  # Default hosted zone for domains that share the same zone.
  zone_id = "Z1234567890ABC"

  # Override hosted zones for SANs that live elsewhere.
  validation_zone_ids = {
    "static.example.com" = "Z0987654321XYZ"
  }

  # Keep Route53 management enabled for the common case.
  create_route53_records = true
  validation_record_ttl  = 60

  # CloudFront certificates must be created in us-east-1.
  certificate_region = "us-east-1"
  key_algorithm      = "RSA_2048"

  tags = {
    Project     = "shared-platform"
    Environment = "prod"
    ManagedBy   = "Terraform"
    Service     = "frontend"
  }
}

Example for external DNS validation:

module "regional_api_certificate" {
  source = "./modules/acm"

  domain_name            = "api.example.net"
  create_route53_records = false
  wait_for_validation    = false
  certificate_region     = "ap-southeast-1"

  tags = {
    Project     = "shared-platform"
    Environment = "prod"
    ManagedBy   = "Terraform"
    Service     = "api"
  }
}
*/