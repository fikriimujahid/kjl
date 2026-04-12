data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id
  
  tags = {
    project     = var.project
    environment = "shared"
    managed_by  = "terraform"
  }
}

data "aws_iam_policy_document" "cicd_runner_trust" {
  statement {
    sid     = "AllowGitHubOIDC"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values   = [
            "repo:${var.github_repo}:ref:refs/heads/dev",
            "repo:${var.github_repo}:ref:refs/heads/pro",
            "repo:${var.github_repo}:pull_request/*",
            "repo:${var.github_repo}:environment:dev",
            "repo:${var.github_repo}:environment:prod",
        ]
    }
  }
}

resource "aws_iam_role" "cicd_runner" {
  name               = "CICDRunnerRole"
  assume_role_policy = data.aws_iam_policy_document.cicd_runner_trust.json

  tags = local.tags
}

data "aws_iam_policy_document" "cicd_runner_policy_doc" {
  statement {
    sid       = "AssumeTerraformRoles"
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = var.assumable_role_arns
  }

  statement {
    sid       = "WriteCloudWatchLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
    resources = [
        "arn:aws:logs:*:${local.account_id}:log-group:*",
        "arn:aws:logs:*:${local.account_id}:log-group:*:log-stream:*",
        "arn:aws:logs:*:${local.account_id}:query-definition:*"
    ]
  }
}

resource "aws_iam_policy" "cicd_runner_policy" {
  name   = "CICDRunnerPolicy"
  policy = data.aws_iam_policy_document.cicd_runner_policy_doc.json

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "cicd_runner_attach" {
  role       = aws_iam_role.cicd_runner.name
  policy_arn = aws_iam_policy.cicd_runner_policy.arn
}