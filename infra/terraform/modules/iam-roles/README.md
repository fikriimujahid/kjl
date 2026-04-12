# IAM Roles Modules

This directory now contains two focused Terraform modules:

- `terraform-env`: creates either the development or main Terraform role from the same shared implementation
- `cicd-runner`: creates the GitHub Actions entry role that can assume the environment roles

## Structure

```text
iam-roles/
  terraform-env/
  cicd-runner/
```

## Bootstrap Usage

```hcl
module "iam_role_dev" {
  source                     = "../../modules/iam-roles/terraform-env"
  environment                = "dev"
  project                   = var.project
  github_repo               = var.github_repo
  github_oidc_provider_arn  = aws_iam_openid_connect_provider.github.arn
  terraform_state_bucket_arn = "arn:aws:s3:::${var.terraform_state_bucket}"
}

module "iam_role_main" {
  source                     = "../../modules/iam-roles/terraform-env"
  environment                = "main"
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
    module.iam_role_main.terraform_main_role_arn,
  ]
}
```

## Notes

- The bootstrap environment now composes one shared environment-role module twice, once for `dev` and once for `main`.
- Resource names are preserved so AWS-side names stay stable.
- Root-level `moved` blocks preserve Terraform state addresses while the duplicated module implementations are removed.
