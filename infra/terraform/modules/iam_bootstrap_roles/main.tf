data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_region" "current" {}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  terraform_assume_role_principals = length(var.terraform_execution_principal_arns) > 0 ? var.terraform_execution_principal_arns : [
    "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
  ]
}

data "aws_iam_policy_document" "terraform_execution_assume_role" {
  statement {
    sid     = "AllowConfiguredPrincipals"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = local.terraform_assume_role_principals
    }
  }
}

resource "aws_iam_role" "terraform_execution" {
  name               = "${local.name_prefix}-terraform-execution-role"
  assume_role_policy = data.aws_iam_policy_document.terraform_execution_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "terraform_execution_permissions" {
  statement {
    sid    = "TerraformStateBucketAccess"
    effect = "Allow"

    actions = [
      "s3:GetBucketLocation",
      "s3:GetBucketVersioning",
      "s3:ListBucket",
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]

    resources = [
      var.state_bucket_arn,
      "${var.state_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "TerraformLockTableAccess"
    effect = "Allow"

    actions = [
      "dynamodb:DescribeTable",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem"
    ]

    resources = [var.lock_table_arn]
  }

  statement {
    sid    = "CloudWatchLogFoundationAccess"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents",
      "logs:PutRetentionPolicy"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*",
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*",
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*",
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*:*"
    ]
  }

  statement {
    sid    = "BudgetReadAccess"
    effect = "Allow"

    actions = [
      "budgets:ViewBudget",
      "budgets:DescribeBudget"
    ]

    resources = ["*"]
  }
}

resource "aws_iam_policy" "terraform_execution" {
  name   = "${local.name_prefix}-terraform-execution-policy"
  policy = data.aws_iam_policy_document.terraform_execution_permissions.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "terraform_execution" {
  role       = aws_iam_role.terraform_execution.name
  policy_arn = aws_iam_policy.terraform_execution.arn
}

data "aws_iam_policy_document" "lambda_execution_assume_role" {
  statement {
    sid     = "AllowLambdaService"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_execution" {
  name               = "${local.name_prefix}-lambda-execution-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_execution_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "lambda_execution_permissions" {
  statement {
    sid    = "LambdaCloudWatchLogging"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*",
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*"
    ]
  }
}

resource "aws_iam_policy" "lambda_execution" {
  name   = "${local.name_prefix}-lambda-execution-policy"
  policy = data.aws_iam_policy_document.lambda_execution_permissions.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.lambda_execution.arn
}

data "aws_iam_policy_document" "api_gateway_assume_role" {
  statement {
    sid     = "AllowApiGatewayService"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["apigateway.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api_gateway" {
  name               = "${local.name_prefix}-api-gateway-role"
  assume_role_policy = data.aws_iam_policy_document.api_gateway_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "api_gateway_permissions" {
  statement {
    sid    = "ApiGatewayCloudWatchLogging"
    effect = "Allow"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:PutLogEvents"
    ]

    resources = [
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*",
      "arn:${data.aws_partition.current.partition}:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/apigateway/*:*"
    ]
  }
}

resource "aws_iam_policy" "api_gateway" {
  name   = "${local.name_prefix}-api-gateway-policy"
  policy = data.aws_iam_policy_document.api_gateway_permissions.json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "api_gateway" {
  role       = aws_iam_role.api_gateway.name
  policy_arn = aws_iam_policy.api_gateway.arn
}

data "aws_iam_policy_document" "cloudfront_assume_role" {
  statement {
    sid     = "AllowCloudFrontService"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "cloudfront_access" {
  name               = "${local.name_prefix}-cloudfront-access-role"
  assume_role_policy = data.aws_iam_policy_document.cloudfront_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "cloudfront_access" {
  count = length(var.cloudfront_origin_bucket_arns) > 0 ? 1 : 0

  statement {
    sid    = "AllowListConfiguredBuckets"
    effect = "Allow"

    actions   = ["s3:ListBucket"]
    resources = var.cloudfront_origin_bucket_arns
  }

  statement {
    sid    = "AllowReadConfiguredBucketObjects"
    effect = "Allow"

    actions   = ["s3:GetObject"]
    resources = [for bucket_arn in var.cloudfront_origin_bucket_arns : "${bucket_arn}/*"]
  }
}

resource "aws_iam_policy" "cloudfront_access" {
  count = length(var.cloudfront_origin_bucket_arns) > 0 ? 1 : 0

  name   = "${local.name_prefix}-cloudfront-access-policy"
  policy = data.aws_iam_policy_document.cloudfront_access[0].json
  tags   = var.tags
}

resource "aws_iam_role_policy_attachment" "cloudfront_access" {
  count = length(var.cloudfront_origin_bucket_arns) > 0 ? 1 : 0

  role       = aws_iam_role.cloudfront_access.name
  policy_arn = aws_iam_policy.cloudfront_access[0].arn
}
