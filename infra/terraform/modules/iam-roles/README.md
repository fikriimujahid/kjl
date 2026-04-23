# iam-roles

Reusable Terraform module that creates two GitHub OIDC-assumable IAM roles:

- Terraform deploy role (`terraform_role_arn`)
- CI/CD runner role (`cicd_runner_role_arn`)

Both roles trust the same GitHub OIDC provider and are restricted to explicit GitHub branch refs.

## Usage

```hcl
module "iam_roles" {
  source = "../iam-roles"

  project                  = "kejepangdulu"
  environment              = "staging"
  github_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  github_repo              = "kejepangdulu/platform"

  terraform_branches = [
    "main",
    "release"
  ]

  cicd_branches = [
    "dev",
    "main"
  ]

  tags = {
    Project     = "kejepangdulu"
    Environment = "staging"
  }
}
```

## Inputs

- `project` (string, required): Project prefix for role names.
- `environment` (string, required): Environment segment for role names.
- `github_oidc_provider_arn` (string, required): IAM OIDC provider ARN.
- `github_repo` (string, required): GitHub repository in `owner/repo` format.
- `terraform_branches` (list(string), required): Allowed branches for Terraform role OIDC trust.
- `cicd_branches` (list(string), optional): Allowed branches for CI/CD runner role OIDC trust. Defaults to `dev`.
- `terraform_role_name` (string, optional): Explicit deploy role name override.
- `cicd_runner_role_name` (string, optional): Explicit runner role name override.
- `terraform_managed_policy_arns` (list(string), optional): Managed policies for deploy role. Default includes `AdministratorAccess`.
- `cicd_runner_managed_policy_arns` (list(string), optional): Managed policies for runner role. Default includes `ReadOnlyAccess`.
- `terraform_inline_policy_json` (string, optional): Inline JSON policy for deploy role.
- `cicd_runner_inline_policy_json` (string, optional): Inline JSON policy for runner role.
- `tags` (map(string), optional): IAM role tags.

## Outputs

- `terraform_role_name`
- `terraform_role_arn`
- `cicd_runner_role_name`
- `cicd_runner_role_arn`
