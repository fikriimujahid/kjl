# ---------------------------------------------------------------------------
# versions.tf
#
# This file tells Terraform two things:
#   1. The minimum Terraform CLI version this module needs.
#   2. Which external provider(s) the module relies on.
#
# Terraform reads this file before doing anything else.  If the running
# Terraform binary is too old, it stops immediately with a clear message
# instead of producing a confusing mid-apply error.
# ---------------------------------------------------------------------------

terraform {
  # Require Terraform 1.5.0 or newer.
  # Why 1.5?  This module uses optional() with defaults in variable types
  # (stable since 1.3) and lifecycle preconditions (stable since 1.2).
  # 1.5 is the first stable release that guarantees all features work together
  # correctly.  An older CLI would either error or silently ignore the checks.
  required_version = ">= 1.5.0"

  required_providers {
    # The AWS provider lets Terraform call the AWS APIs to create, update,
    # and delete cloud resources such as S3 buckets and IAM policies.
    aws = {
      # "hashicorp/aws" is the official provider maintained by HashiCorp.
      # The registry path prevents accidental use of a similarly-named
      # third-party fork.
      source = "hashicorp/aws"

      # ">= 6.0" means:
      #   • Any 6.x version (6.0, 6.1, 6.100 …) is accepted.
      #   • Version 7.0 or newer is rejected.
      # This is a pessimistic constraint: it allows backward-compatible patch
      # and minor updates but stops a jump to the next major version, which
      # could contain breaking changes that require code updates.
      version = ">= 6.0"
    }
  }
}