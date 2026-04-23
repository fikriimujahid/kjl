# ---------------------------------------------------------------------------
# versions.tf
#
# Declares the minimum Terraform CLI version and the provider dependencies
# required by this module.  Terraform reads this file before anything else.
#
# Why does a module need its own versions.tf?
#   Modules can be consumed by many different root configurations.  By
#   declaring version constraints here the module is self-documenting: users
#   immediately know which tool and provider versions are compatible.
# ---------------------------------------------------------------------------

terraform {
  # required_version sets the MINIMUM Terraform CLI version needed to use
  # this module.  ">= 1.5.0" means any CLI version 1.5 or higher is fine.
  #
  # Why 1.5.0?
  #   This module uses:
  #     - optional() inside object types (1.3+)
  #     - Inherited provider configuration in modules (mature since 1.x)
  #   Pinning to 1.5 gives a small buffer above those minimums while still
  #   being widely adopted.
  required_version = ">= 1.5.0"

  required_providers {
    # The AWS provider handles authentication and API calls for every
    # aws_* resource and data source in this module.
    aws = {
      # source = the Terraform Registry namespace where this provider lives.
      # "hashicorp/aws" is the official AWS provider maintained by HashiCorp.
      source = "hashicorp/aws"

      # version = "~> 6.0" is a pessimistic constraint operator:
      #   - Allows  6.0, 6.1, 6.2, ..., 6.99
      #   - Blocks  5.x (too old) and 7.0 (potentially breaking)
      # This means the module is compatible with any 6.x patch or minor release
      # but will not accidentally pull in a future major 7.0 release that could
      # change resource schemas in breaking ways.
      version = "~> 6.0"
    }
  }
}