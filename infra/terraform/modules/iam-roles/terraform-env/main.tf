data "aws_caller_identity" "current" {}

locals {
  # The former dev/main modules were identical apart from a small set of
  # environment values, so this module centralizes that logic behind one input.
  account_id        = data.aws_caller_identity.current.account_id
  environment_title = title(var.environment)

  role_name            = "${var.project}_Terraform${local.environment_title}Role"
  permissions_boundary = "arn:aws:iam::${local.account_id}:policy/${var.project}_PermissionsBoundary"
  policy_name          = "${var.project}_Terraform${local.environment_title}Policy"
  external_id          = "terraform-${var.environment}"
  workload_pattern     = "${var.project}*-${var.environment}*"
  route53_boundary_resources = var.hosted_zone_id != null ? [
    "arn:aws:route53:::hostedzone/${var.hosted_zone_id}"
  ] : ["*"]
  route53_policy_resources = local.route53_boundary_resources

  # Dev keeps the broader branch and PR trust it had before, while main stays
  # restricted to the main branch and main GitHub environment.
  github_oidc_subjects = var.environment == "dev" ? [
    "repo:${var.github_repo}:ref:refs/heads/dev",
    "repo:${var.github_repo}:ref:refs/heads/main",
    "repo:${var.github_repo}:pull_request/*",
    "repo:${var.github_repo}:environment:dev",
    "repo:${var.github_repo}:environment:main",
    ] : [
    "repo:${var.github_repo}:ref:refs/heads/main",
    "repo:${var.github_repo}:environment:main",
  ]

  tags = {
    project     = var.project
    environment = "shared"
    managed_by  = "terraform"
  }
}

data "aws_iam_policy_document" "permissions_boundary" {
  statement {
    sid    = "AllowS3ProjectResources"
    effect = "Allow"
    actions = ["s3:*"]
    resources = [
      "arn:aws:s3:::${var.project}*",
      "arn:aws:s3:::${var.project}*/*"
    ]
  }

  statement {
    sid    = "AllowDynamoDBProjectResources"
    effect = "Allow"
    actions = [
      "dynamodb:*"
    ]
    resources = [
      "arn:aws:dynamodb:*:${local.account_id}:table/${var.project}*"
    ]
  }

  statement {
    sid    = "AllowLambdaProjectResources"
    effect = "Allow"
    actions = [
      "lambda:*"
    ]
    resources = [
      "arn:aws:lambda:*:${local.account_id}:function:${var.project}*"
    ]
  }

  statement {
    sid    = "AllowCloudWatchProjectResources"
    effect = "Allow"
    actions = [
      "cloudwatch:*"
    ]
    resources = [
      "arn:aws:cloudwatch::${local.account_id}:dashboard/${var.project}*",
      "arn:aws:cloudwatch:*:${local.account_id}:alarm:${var.project}*"
    ]
  }

  statement {
    sid    = "AllowCloudWatchLogsProjectResources"
    effect = "Allow"
    actions = [
      "logs:*"
    ]
    resources = [
      "arn:aws:logs:*:${local.account_id}:log-group:/aws/lambda/${var.project}*",
      "arn:aws:logs:*:${local.account_id}:log-group:/aws/lambda/${var.project}*:log-stream:*"
    ]
  }

  statement {
    sid    = "AllowApiGatewayResources"
    effect = "Allow"
    actions = [
      "apigateway:*"
    ]
    resources = [
      "arn:aws:apigateway:*::/restapis/*"
    ]
  }

  statement {
    sid    = "AllowRoute53Resources"
    effect = "Allow"
    actions = [
      "route53:*"
    ]
    # TODO: pass var.hosted_zone_id from callers to eliminate wildcard route53
    # permissions and scope Route53 access to one hosted zone.
    resources = local.route53_boundary_resources
  }

  statement {
    sid    = "AllowCloudFormationProjectResources"
    effect = "Allow"
    actions = [
      "cloudformation:*"
    ]
    resources = [
      "arn:aws:cloudformation:*:${local.account_id}:stack/${var.project}*"
    ]
  }

  statement {
    sid    = "AllowBudgetProjectResources"
    effect = "Allow"
    actions = [
      "budgets:*"
    ]
    resources = [
      "arn:aws:budgets::${local.account_id}:budget/${var.project}*"
    ]
  }

  statement {
    sid    = "AllowEventBridgeProjectResources"
    effect = "Allow"
    actions = [
      "events:*"
    ]
    resources = [
      "arn:aws:events:*:${local.account_id}:rule/${var.project}*",
      "arn:aws:events:*:${local.account_id}:event-bus/default"
    ]
  }

  statement {
    sid    = "AllowSnsProjectResources"
    effect = "Allow"
    actions = [
      "sns:*"
    ]
    resources = [
      "arn:aws:sns:*:${local.account_id}:${var.project}*"
    ]
  }

  statement {
    sid    = "AllowSqsProjectResources"
    effect = "Allow"
    actions = [
      "sqs:*"
    ]
    resources = [
      "arn:aws:sqs:*:${local.account_id}:${var.project}*"
    ]
  }

  statement {
    sid    = "AllowAcmAccountCertificateResources"
    effect = "Allow"
    actions = [
      "acm:*"
    ]
    resources = [
      "arn:aws:acm:*:${local.account_id}:certificate/*"
    ]
  }

  statement {
    sid    = "AllowCloudFrontAccountResources"
    effect = "Allow"
    actions = [
      "cloudfront:*"
    ]
    resources = [
      "arn:aws:cloudfront::${local.account_id}:distribution/*",
      "arn:aws:cloudfront::${local.account_id}:origin-access-control/*"
    ]
  }

  statement {
    sid    = "AllowCognitoAccountResources"
    effect = "Allow"
    actions = [
      "cognito-idp:*"
    ]
    resources = [
      "arn:aws:cognito-idp:*:${local.account_id}:userpool/*"
    ]
  }

  statement {
    sid    = "AllowUnscopedReadListActions"
    effect = "Allow"
    actions = [
      "acm:ListCertificates",
      "apigateway:GET",
      "cloudformation:DescribeStacks",
      "cloudformation:GetTemplateSummary",
      "cloudformation:ListStackResources",
      "cloudformation:ListStacks",
      "cloudformation:ValidateTemplate",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListDashboards",
      "cloudwatch:ListMetrics",
      "dynamodb:ListTables",
      "lambda:ListFunctions",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "route53:GetChange",
      "route53:ListHostedZones",
      "s3:ListAllMyBuckets"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "DenySensitiveServices"
    effect = "Deny"
    actions = [
      "iam:*",
      "organizations:*",
      "account:*",
      "kms:*",
      "secretsmanager:*",
      "ec2:*",
      "sso:*"
    ]
    resources = ["*"]
  }

  statement {
    sid       = "DenyAssumeRoleOutsideApprovedPatterns"
    effect    = "Deny"
    actions   = ["sts:AssumeRole"]
    resources = ["*"]

    condition {
      test     = "ArnNotLike"
      variable = "aws:ResourceArn"
      values   = ["arn:aws:iam::${local.account_id}:role/${var.project}*"]
    }
  }

  statement {
    sid       = "DenyActionsForNonProjectPrincipals"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "ArnNotLike"
      variable = "aws:PrincipalArn"
      values   = ["arn:aws:iam::${local.account_id}:role/${var.project}*"]
    }
  }
}

resource "aws_iam_policy" "permissions_boundary" {
  count  = var.environment == "dev" ? 1 : 0
  name   = "${var.project}_PermissionsBoundary"
  policy = data.aws_iam_policy_document.permissions_boundary.json

  tags = local.tags
}

data "aws_iam_policy_document" "terraform_env_trust" {
  statement {
    sid     = "AllowTerraformAdminUser"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${local.account_id}:user/terraform-admin"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [local.external_id]
    }
  }

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
      values   = local.github_oidc_subjects
    }
  }
}

resource "aws_iam_role" "terraform_env" {
  name               = local.role_name
  assume_role_policy = data.aws_iam_policy_document.terraform_env_trust.json

  tags = local.tags
}

data "aws_iam_policy_document" "terraform_env_policy_base" {
  statement {
    sid       = "AllowProjectTaggedResources"
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/project"
      values   = [var.project]
    }
  }

  statement {
    sid       = "AllowCreateWithProjectTag"
    effect    = "Allow"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/project"
      values   = [var.project]
    }
  }

  statement {
    sid    = "AllowReadListOperations"
    effect = "Allow"
    actions = [
      "iam:Get*",
      "iam:List*",
      "route53:ListHostedZones",
      "route53:GetChange",
      "acm:ListCertificates",
      "cloudfront:ListDistributions"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "terraform_env_policy_dev_denies" {
  count = var.environment == "dev" ? 1 : 0

  # Dev keeps the explicit guardrails that prevent access to main-tagged
  # resources and the main state prefix, while the main role remains unchanged.
  statement {
    sid       = "DenyMainTaggedResources"
    effect    = "Deny"
    actions   = ["*"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/environment"
      values   = ["main"]
    }
  }

  statement {
    sid       = "DenyMainStateObjects"
    effect    = "Deny"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${var.terraform_state_bucket_arn}/main/*"]
  }
}

data "aws_iam_policy_document" "terraform_env_policy" {
  source_policy_documents = concat(
    [data.aws_iam_policy_document.terraform_env_policy_base.json],
    var.environment == "dev" ? [data.aws_iam_policy_document.terraform_env_policy_dev_denies[0].json] : []
  )
}

resource "aws_iam_policy" "terraform_env_policy" {
  name   = local.policy_name
  policy = data.aws_iam_policy_document.terraform_env_policy.json

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "terraform_env_attach" {
  role       = aws_iam_role.terraform_env.name
  policy_arn = aws_iam_policy.terraform_env_policy.arn
}
