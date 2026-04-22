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

  # Route53 DNS validation records are managed automatically when
  # existing_certificate_arn is not set.
  validation_record_ttl = 60

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

Example for using an existing certificate (no new ACM/Route53 resources):

module "regional_api_certificate" {
  source = "./modules/acm"

  existing_certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/11111111-2222-3333-4444-555555555555"
  domain_name             = "api.example.net"
  certificate_region      = "ap-southeast-1"

  tags = {
    Project     = "shared-platform"
    Environment = "prod"
    ManagedBy   = "Terraform"
    Service     = "api"
  }
}
*/