# This file is an example only.
# The entire file is wrapped in a block comment so Terraform does not create
# any resources from it.
# Beginners can copy this example into a real root module and then replace the
# sample values with their own hosted zone IDs and domain names.
/*
# Create a reusable DNS module instance for a production-style application.
module "platform_dns" {
  # Point Terraform to the module directory.
  source = "./modules/route53"

  # Most records in this example live in the same public hosted zone.
  # Setting default_zone_id avoids repeating the same zone_id in every record.
  default_zone_id = "Z1234567890ABC"

  # Choose which record should feed the top-level fqdn output.
  # This is useful when the module manages multiple records but one record is
  # considered the main application entry point.
  primary_record_key = "frontend_a"

  # Route53 records themselves cannot be tagged.
  # These tags apply only to managed Route53 health checks.
  tags = {
    Project     = "shared-platform"
    Environment = "prod"
    ManagedBy   = "Terraform"
  }

  # Define health checks that the DNS records can reference by logical key.
  # This avoids hard-coding AWS health check IDs outside the module.
  health_checks = {
    # Health check for the main frontend endpoint.
    frontend_https = {
      # Use an HTTPS endpoint check.
      type = "HTTPS"

      # Check the public hostname users reach.
      fqdn = "app.example.com"

      # Probe a simple health endpoint.
      resource_path = "/healthz"

      # Check every 30 seconds.
      request_interval = 30

      # Require three consecutive failures before the endpoint is treated as unhealthy.
      failure_threshold = 3

      # Limit the Route53 checker regions for this example.
      regions = ["ap-southeast-1", "us-east-1"]

      # Add tags for operations visibility.
      tags = {
        Service = "frontend"
      }
    }

    # Health check for the primary API endpoint.
    api_primary = {
      # Use HTTPS string match so Route53 looks for a known healthy response.
      type = "HTTPS_STR_MATCH"

      # Check the primary API backend directly.
      fqdn = "api-primary.internal.example.com"

      # Use the default HTTPS port explicitly for readability.
      port = 443

      # Probe a readiness endpoint.
      resource_path = "/ready"

      # The response must contain this text to be considered healthy.
      search_string = "ok"

      # Check every 30 seconds.
      request_interval = 30

      # Require three consecutive failures before the endpoint is treated as unhealthy.
      failure_threshold = 3

      # Use multiple Route53 checker regions.
      regions = ["ap-southeast-1", "us-west-2"]

      # Tag the health check so it is easy to identify in AWS.
      tags = {
        Service = "api"
        Role    = "primary"
      }
    }

    # Health check for the secondary API endpoint.
    api_secondary = {
      # Use the same kind of string match check as the primary endpoint.
      type = "HTTPS_STR_MATCH"

      # Check the standby API backend directly.
      fqdn = "api-secondary.internal.example.com"

      # Use the default HTTPS port explicitly for readability.
      port = 443

      # Probe a readiness endpoint.
      resource_path = "/ready"

      # The response must contain this text to be considered healthy.
      search_string = "ok"

      # Check every 30 seconds.
      request_interval = 30

      # Require three consecutive failures before the endpoint is treated as unhealthy.
      failure_threshold = 3

      # Use multiple Route53 checker regions.
      regions = ["ap-southeast-1", "us-west-2"]

      # Tag the health check so it is easy to identify in AWS.
      tags = {
        Service = "api"
        Role    = "secondary"
      }
    }
  }

  # Define all DNS records managed by the module.
  records = {
    # Create the main IPv4 alias record for the application.
    frontend_a = {
      # Create the DNS name users will visit.
      name = "app.example.com"

      # Use an A record because the target is a CloudFront alias.
      type = "A"

      # Alias records point to AWS-managed targets without literal IP values.
      alias = {
        # This is the CloudFront distribution domain name.
        name = "d111111abcdef8.cloudfront.net"

        # This is CloudFront's hosted zone ID.
        zone_id = "Z2FDTNDATAQYW2"

        # CloudFront health is not evaluated through Route53 in this example.
        evaluate_target_health = false
      }

      # Attach the module-managed frontend health check.
      health_check_key = "frontend_https"
    }

    # Create the matching IPv6 alias record for dual-stack clients.
    frontend_aaaa = {
      # Reuse the same hostname as the IPv4 record.
      name = "app.example.com"

      # Use AAAA for IPv6.
      type = "AAAA"

      # Point to the same CloudFront distribution.
      alias = {
        # This is the CloudFront distribution domain name.
        name = "d111111abcdef8.cloudfront.net"

        # This is CloudFront's hosted zone ID.
        zone_id = "Z2FDTNDATAQYW2"

        # CloudFront health is not evaluated through Route53 in this example.
        evaluate_target_health = false
      }
    }

    # Create the primary API failover record.
    api_primary = {
      # Use the public API hostname.
      name = "api.example.com"

      # Use CNAME because the target is another DNS name.
      type = "CNAME"

      # Standard records need a TTL.
      ttl = 60

      # Route53 needs a set identifier to distinguish the primary record.
      set_identifier = "primary"

      # Attach the module-managed primary API health check.
      health_check_key = "api_primary"

      # Mark this record as the primary failover target.
      failover_routing_policy = {
        type = "PRIMARY"
      }

      # Send traffic to the primary backend hostname.
      records = ["api-primary.internal.example.com"]
    }

    # Create the secondary API failover record.
    api_secondary = {
      # Use the same public API hostname.
      name = "api.example.com"

      # Use CNAME because the target is another DNS name.
      type = "CNAME"

      # Standard records need a TTL.
      ttl = 60

      # Route53 needs a set identifier to distinguish the secondary record.
      set_identifier = "secondary"

      # Attach the module-managed secondary API health check.
      health_check_key = "api_secondary"

      # Mark this record as the secondary failover target.
      failover_routing_policy = {
        type = "SECONDARY"
      }

      # Send traffic to the standby backend hostname.
      records = ["api-secondary.internal.example.com"]
    }

    # Create a convenience redirect-style hostname for www traffic.
    www = {
      # Users can visit the www hostname.
      name = "www.app.example.com"

      # Use a CNAME to point to the main application hostname.
      type = "CNAME"

      # Cache the answer for 300 seconds.
      ttl = 300

      # Return the main hostname as the value.
      records = ["app.example.com"]
    }

    # Create a TXT record for DMARC or ownership verification.
    dmarc = {
      # DMARC records use a special DNS name.
      name = "_dmarc.app.example.com"

      # Use TXT because the value is plain text policy data.
      type = "TXT"

      # Cache the answer for 300 seconds.
      ttl = 300

      # Return the DMARC policy string.
      records = ["v=DMARC1; p=reject; rua=mailto:dmarc@example.com"]
    }
  }
}
*/