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

      # Support both GitHub OIDC subject formats:
      # - ref:refs/heads/<branch> when no job environment is set
      # - environment:<name> when jobs use the "environment" key
      values = concat(
        [
          for branch in var.branches :
          "repo:${var.github_repo}:ref:refs/heads/${branch}"
        ],
        [
          for branch in var.branches :
          "repo:${var.github_repo}:environment:${branch}"
        ]
      )
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