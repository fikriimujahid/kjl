# IAM Roles Modules

This directory now contains three focused Terraform modules instead of one monolithic IAM module:

- `dev`: creates the development Terraform role and its policies
- `prod`: creates the production Terraform role and its policies
- `cicd-runner`: creates the GitHub Actions entry role that can assume the environment roles

## Structure

```text
iam-roles/
  dev/
  prod/
  cicd-runner/
```

## Bootstrap Usage

```hcl
module "iam_role_dev" {
  source                    = "../../modules/iam-roles/dev"
  project                   = var.project
  github_repo               = var.github_repo
  github_oidc_provider_arn  = aws_iam_openid_connect_provider.github.arn
  terraform_state_bucket_arn = "arn:aws:s3:::${var.terraform_state_bucket}"
}

module "iam_role_prod" {
  source                    = "../../modules/iam-roles/prod"
  project                   = var.project
  github_repo               = var.github_repo
  github_oidc_provider_arn  = aws_iam_openid_connect_provider.github.arn
  terraform_state_bucket_arn = "arn:aws:s3:::${var.terraform_state_bucket}"
}

module "iam_role_cicd_runner" {
  source                   = "../../modules/iam-roles/cicd-runner"
  project                  = var.project
  github_repo              = var.github_repo
  github_oidc_provider_arn = aws_iam_openid_connect_provider.github.arn
  assumable_role_arns = [
    module.iam_role_dev.terraform_dev_role_arn,
    module.iam_role_prod.terraform_prod_role_arn,
  ]
}
```

## Notes

- The bootstrap environment now owns the composition of the three submodules.
- Resource names are preserved so AWS-side names stay stable.
- Terraform state moves are required when migrating from the old `module.iam_roles` address to the new module addresses.
