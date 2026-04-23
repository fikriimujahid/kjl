data "aws_iam_policy_document" "github_oidc" {

  statement {
    effect = "Allow"

    actions = [
      "sts:AssumeRoleWithWebIdentity"
    ]

    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"

      values = [
        "sts.amazonaws.com"
      ]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"

      values = [
        for branch in var.branches :
        "repo:${var.github_repo}:ref:refs/heads/${branch}"
      ]
    }
  }
}

module "role" {
  source = "../iam-roles"

  role_name = var.role_name

  assume_role_policy_json = data.aws_iam_policy_document.github_oidc.json

  managed_policy_arns = var.managed_policy_arns

  tags = var.tags
}