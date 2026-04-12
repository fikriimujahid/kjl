data "aws_caller_identity" "current" {}

locals {
  account_id = data.aws_caller_identity.current.account_id

  tags = {
    project     = var.project
    environment = "shared"
    managed_by  = "terraform"
  }
}

data "aws_iam_policy_document" "kjl_terraform_prod_trust" {
  statement {
    sid     = "AllowTerraformAdminUser"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:user/terraform-admin"]
    }

    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = ["terraform-prod"]
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

    # Production role assumption is restricted to explicit production GitHub contexts only.
    # This blocks non-production branches, pull requests, and development environments from
    # receiving production AWS credentials through GitHub OIDC.
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:ref:refs/heads/pro",
        "repo:${var.github_repo}:environment:prod"
      ]
    }
  }
}

resource "aws_iam_role" "kjl_terraform_prod" {
  name               = "KJL_TerraformProdRole"
  assume_role_policy = data.aws_iam_policy_document.kjl_terraform_prod_trust.json

  tags = local.tags
}

data "aws_iam_policy_document" "kjl_terraform_prod_policy_services_doc" {
  statement {
    sid    = "CloudFrontManagement"
    effect = "Allow"
    actions = [
      "cloudfront:GetDistribution",
      "cloudfront:ListTagsForResource",
      "cloudfront:TagResource",
      "cloudfront:UntagResource",
      "cloudfront:GetOriginAccessControl",
      "cloudfront:CreateDistribution",
      "cloudfront:CreateDistributionWithTags",
      "cloudfront:UpdateDistribution",
      "cloudfront:DeleteDistribution",
      "cloudfront:DeleteOriginAccessControl",
      "cloudfront:UpdateOriginAccessControl",
      "cloudfront:CreateOriginAccessControl"
    ]
    resources = [
      "arn:aws:cloudfront::${local.account_id}:distribution/*",
      "arn:aws:cloudfront::${local.account_id}:origin-access-control/*"
    ]
  }

  statement {
    sid    = "S3StateObjects"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:DeleteObject"
    ]
    resources = ["${var.terraform_state_bucket_arn}/*"]
  }

  # Wildcard bucket access was removed so Terraform can only manage buckets owned
  # by this project plus the dedicated Terraform state bucket.
  statement {
    sid    = "S3BucketManagement"
    effect = "Allow"
    actions = [
      "s3:CreateBucket",
      "s3:DeleteBucket",
      "s3:ListBucket",
      "s3:GetBucketLocation",
      "s3:PutBucketPolicy",
      "s3:DeleteBucketPolicy",
      "s3:GetBucketPolicy",
      "s3:GetBucketAcl",
      "s3:PutBucketAcl",
      "s3:PutBucketVersioning",
      "s3:GetBucketVersioning",
      "s3:PutBucketPublicAccessBlock",
      "s3:GetBucketPublicAccessBlock",
      "s3:PutEncryptionConfiguration",
      "s3:GetEncryptionConfiguration",
      "s3:PutBucketTagging",
      "s3:GetBucketTagging",
      "s3:PutBucketCORS",
      "s3:GetBucketCORS",
      "s3:PutBucketWebsite",
      "s3:GetBucketWebsite",
      "s3:PutBucketLogging",
      "s3:GetBucketLogging",
      "s3:GetBucketAccelerateConfiguration",
      "s3:PutBucketAccelerateConfiguration",
      "s3:GetAccelerateConfiguration",
      "s3:GetBucketRequestPayment",
      "s3:GetLifecycleConfiguration",
      "s3:PutLifecycleConfiguration",
      "s3:GetReplicationConfiguration",
      "s3:PutReplicationConfiguration",
      "s3:GetBucketObjectLockConfiguration",
      "s3:PutObjectLockConfiguration"
    ]
    resources = [
      "arn:aws:s3:::${var.project}*",
      var.terraform_state_bucket_arn
    ]
  }

  statement {
    sid       = "S3BucketDiscovery"
    effect    = "Allow"
    actions   = ["s3:ListAllMyBuckets"]
    resources = ["*"]
  }

  statement {
    sid    = "S3ObjectOperations"
    effect = "Allow"
    actions = [
      "s3:PutObject",
      "s3:GetObject",
      "s3:DeleteObject",
      "s3:PutObjectAcl",
      "s3:GetObjectAcl"
    ]
    resources = [
      "arn:aws:s3:::${var.project}*/*",
      "${var.terraform_state_bucket_arn}/*"
    ]
  }

  statement {
    sid    = "DynamoDBManagement"
    effect = "Allow"
    actions = [
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeTable",
      "dynamodb:UpdateTable",
      "dynamodb:ListTables",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:ListTagsOfResource",
      "dynamodb:UpdateTimeToLive",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:DescribeContinuousBackups"
    ]
    resources = ["arn:aws:dynamodb:*:${local.account_id}:table/*"]
  }

  statement {
    sid    = "Route53AndACM"
    effect = "Allow"
    # ACM certificate creation is part of the Terraform lifecycle, so this block
    # includes write actions and keeps wildcard resources for certificate requests.
    actions = [
      "route53:ListHostedZones",
      "route53:GetHostedZone",
      "route53:ListTagsForResource",
      "route53:ListResourceRecordSets",
      "route53:ChangeResourceRecordSets",
      "route53:GetChange",
      "acm:RequestCertificate",
      "acm:DeleteCertificate",
      "acm:AddTagsToCertificate",
      "acm:RemoveTagsFromCertificate",
      "acm:ListCertificates",
      "acm:GetCertificate",
      "acm:ListTagsForCertificate",
      "acm:DescribeCertificate"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CognitoUserPools"
    effect = "Allow"
    actions = [
      "cognito-idp:CreateUserPool",
      "cognito-idp:DeleteUserPool",
      "cognito-idp:DescribeUserPool",
      "cognito-idp:UpdateUserPool",
      "cognito-idp:CreateUserPoolClient",
      "cognito-idp:DeleteUserPoolClient",
      "cognito-idp:DescribeUserPoolClient",
      "cognito-idp:UpdateUserPoolClient",
      "cognito-idp:ListUserPools",
      "cognito-idp:ListUserPoolClients",
      "cognito-idp:ListTagsForResource",
      "cognito-idp:TagResource",
      "cognito-idp:UntagResource",
      "cognito-idp:SetUserPoolMfaConfig",
      "cognito-idp:GetUserPoolMfaConfig"
    ]
    resources = ["arn:aws:cognito-idp:*:${local.account_id}:userpool/*"]
  }

  statement {
    sid    = "BudgetsManagement"
    effect = "Allow"
    actions = [
      "budgets:ViewBudget",
      "budgets:ModifyBudget",
      "budgets:TagResource",
      "budgets:ListTagsForResource",
      "budgets:UntagResource"
    ]
    resources = ["arn:aws:budgets::${local.account_id}:budget/${var.project}*"]
  }

  statement {
    sid    = "CloudWatchManagement"
    effect = "Allow"
    actions = [
      "cloudwatch:GetDashboard",
      "cloudwatch:PutDashboard",
      "cloudwatch:DeleteDashboard",
      "cloudwatch:ListDashboards",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:GetMetricStatistics",
      "cloudwatch:ListMetrics",
      "cloudwatch:DisableAlarmActions",
      "cloudwatch:EnableAlarmActions",
      "cloudwatch:TagResource",
      "cloudwatch:UntagResource",
      "cloudwatch:ListTagsForResource",
      "cloudwatch:PutCompositeAlarm",
      "cloudwatch:DeleteCompositeAlarm"
    ]
    resources = concat(
      ["arn:aws:cloudwatch::${local.account_id}:dashboard/${var.project}*"],
      ["arn:aws:cloudwatch:*:${local.account_id}:alarm:*"]
    )
  }
}

data "aws_iam_policy_document" "kjl_terraform_prod_policy_infra_doc" {
  # State bucket access must come from the configured module input so the same
  # IAM policy works across environments without hardcoded bucket naming logic.
  statement {
    sid    = "S3StateBucket"
    effect = "Allow"
    actions = [
      "s3:ListBucket",
      "s3:GetBucketVersioning"
    ]
    resources = [var.terraform_state_bucket_arn]
  }

  statement {
    sid    = "CloudFormationForSAM"
    effect = "Allow"
    actions = [
      "cloudformation:CreateChangeSet",
      "cloudformation:DescribeChangeSet",
      "cloudformation:ExecuteChangeSet",
      "cloudformation:DeleteChangeSet",
      "cloudformation:CreateStack",
      "cloudformation:UpdateStack",
      "cloudformation:DeleteStack",
      "cloudformation:DescribeStacks",
      "cloudformation:DescribeStackEvents",
      "cloudformation:DescribeStackResources",
      "cloudformation:GetTemplate",
      "cloudformation:ListStacks",
      "cloudformation:ListStackResources",
      "cloudformation:ValidateTemplate",
      "cloudformation:GetTemplateSummary"
    ]
    resources = [
      "arn:aws:cloudformation:*:${local.account_id}:stack/${var.project}*-main*/*",
      "arn:aws:cloudformation:*:${local.account_id}:stack/aws-sam-cli-managed-default/*",
      "arn:aws:cloudformation:*:aws:transform/*"
    ]
  }

  statement {
    sid    = "LambdaForSAM"
    effect = "Allow"
    actions = [
      "lambda:CreateFunction",
      "lambda:DeleteFunction",
      "lambda:GetFunction",
      "lambda:GetFunctionConfiguration",
      "lambda:UpdateFunctionCode",
      "lambda:UpdateFunctionConfiguration",
      "lambda:ListFunctions",
      "lambda:ListVersionsByFunction",
      "lambda:PublishVersion",
      "lambda:CreateAlias",
      "lambda:DeleteAlias",
      "lambda:UpdateAlias",
      "lambda:GetAlias",
      "lambda:ListAliases",
      "lambda:AddPermission",
      "lambda:RemovePermission",
      "lambda:GetPolicy",
      "lambda:TagResource",
      "lambda:UntagResource",
      "lambda:ListTags",
      "lambda:PutFunctionConcurrency",
      "lambda:DeleteFunctionConcurrency"
    ]
    resources = ["arn:aws:lambda:*:${local.account_id}:function:${var.project}*-main*"]
  }

  statement {
    sid    = "ApiGatewayForSAM"
    effect = "Allow"
    actions = [
      "apigateway:POST",
      "apigateway:GET",
      "apigateway:PUT",
      "apigateway:PATCH",
      "apigateway:DELETE",
      "apigateway:UpdateRestApiPolicy"
    ]
    resources = ["arn:aws:apigateway:*::/*"]
  }

  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogGroups",
      "logs:DescribeLogStreams",
      "logs:DeleteLogGroup",
      "logs:PutRetentionPolicy",
      "logs:TagLogGroup",
      "logs:UntagLogGroup",
      "logs:PutQueryDefinition",
      "logs:DeleteQueryDefinition",
      "logs:DescribeQueryDefinitions",
      "logs:ListTagsLogGroup",
      "logs:ListTagsForResource"
    ]
    resources = [
      "arn:aws:logs:*:${local.account_id}:log-group:*",
      "arn:aws:logs:*:${local.account_id}:log-group:*:log-stream:*",
      "arn:aws:logs:*:${local.account_id}:query-definition:*"
    ]
  }

  statement {
    sid    = "IAMReadOnlyDiscovery"
    effect = "Allow"
    actions = [
      "iam:GetPolicy",
      "iam:GetUser",
      "iam:ListPolicies",
      "iam:ListRoles"
    ]
    resources = ["*"]
  }

  # Wildcard role management was removed so Terraform can only create and update
  # IAM roles that belong to this project instead of any role in the account.
  statement {
    sid    = "IAMProjectRoleManagement"
    effect = "Allow"
    actions = [
      "iam:GetRole",
      "iam:TagRole",
      "iam:ListAttachedRolePolicies",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:CreateRole",
      "iam:ListRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:DeleteRole",
      "iam:PutRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy"
    ]
    resources = [
      "arn:aws:iam::${local.account_id}:role/${var.project}*"
    ]
  }

  statement {
    sid       = "IAMServiceLinkedRoleManagement"
    effect    = "Allow"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["*"]
  }

  # PassRole is restricted to project roles and only to the AWS services that
  # deploy this application, which removes arbitrary service escalation paths.
  statement {
    sid     = "IAMPassProjectRolesToApprovedServices"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      "arn:aws:iam::${local.account_id}:role/${var.project}*"
    ]

    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values = [
        "lambda.amazonaws.com",
        "apigateway.amazonaws.com"
      ]
    }
  }
}

resource "aws_iam_policy" "kjl_terraform_prod_policy_infra" {
  name   = "TerraformProdPolicyInfra"
  policy = data.aws_iam_policy_document.kjl_terraform_prod_policy_infra_doc.json

  tags = local.tags
}

resource "aws_iam_policy" "kjl_terraform_prod_policy_services" {
  name   = "TerraformProdPolicyServices"
  policy = data.aws_iam_policy_document.kjl_terraform_prod_policy_services_doc.json

  tags = local.tags
}

resource "aws_iam_role_policy_attachment" "kjl_terraform_prod_attach_infra" {
  role       = aws_iam_role.kjl_terraform_prod.name
  policy_arn = aws_iam_policy.kjl_terraform_prod_policy_infra.arn
}

resource "aws_iam_role_policy_attachment" "kjl_terraform_prod_attach_services" {
  role       = aws_iam_role.kjl_terraform_prod.name
  policy_arn = aws_iam_policy.kjl_terraform_prod_policy_services.arn
}