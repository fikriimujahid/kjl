# ---------------------------------------------------------------------------
# versions.tf
#
# This file declares the minimum Terraform version and the external providers
# that this module needs.  Terraform reads it before doing anything else, so
# if the version constraints are not met the plan fails with a clear message
# rather than a confusing runtime error.
# ---------------------------------------------------------------------------

terraform {
  # Require Terraform 1.5.0 or newer.
  # Version 1.5 introduced lifecycle preconditions (used in main.tf).
  # Without this guard an older Terraform binary would silently ignore those
  # checks and let invalid configurations reach AWS.
  required_version = ">= 1.5.0"

  required_providers {
    # The AWS provider gives Terraform access to AWS resources such as ACM
    # certificates and Route53 records.
    aws = {
      # "hashicorp/aws" is the official, HashiCorp-maintained provider.
      # Using the full registry address prevents accidental use of a
      # third-party fork with the same short name.
      source = "hashicorp/aws"

      # "~> 6.0" means "any 6.x version".  It allows minor and patch updates
      # (6.1, 6.2, …) but blocks a jump to the next major version (7.x) which
      # could contain breaking changes.
      version = "~> 6.0"
    }
  }
}