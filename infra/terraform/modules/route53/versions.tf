# This block tells Terraform which CLI version and provider versions are safe
# to use with this module.
# Terraform reads this before it evaluates resources, variables, or locals.
# Keeping these constraints here helps beginners know which tool versions are expected.
terraform {
  # Require Terraform 1.5.0 or newer.
  # This matters because the module uses newer language features such as
  # optional object attributes and check blocks.
  required_version = ">= 1.5.0"

  # Declare which external providers this module depends on.
  # A provider is the plugin that lets Terraform talk to AWS APIs.
  required_providers {
    aws = {
      # Use the official AWS provider published by HashiCorp.
      # This provider contains the Route53 resources used throughout the module.
      source = "hashicorp/aws"

      # Allow any compatible 6.x provider release.
      # This avoids unplanned breaking changes from a future major provider version.
      version = "~> 6.0"
    }
  }
}