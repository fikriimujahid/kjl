data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "lambda_execution" {
  for_each = var.lambdas

  name               = "${each.value.name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  for_each = var.lambdas

  role       = aws_iam_role.lambda_execution[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

locals {
  lambda_dynamodb_policy_candidates = {
    for key, lambda_cfg in var.lambdas : key => {
      table_arns = distinct(compact([
        for _, access_cfg in try(lambda_cfg.dynamodb_access, {}) : try(access_cfg.table_arn, null)
        if try(access_cfg.read, false) || try(access_cfg.write, false)
      ]))

      actions = distinct(flatten([
        for _, access_cfg in try(lambda_cfg.dynamodb_access, {}) : concat(
          try(access_cfg.read, false) ? var.dynamodb_read_actions : [],
          try(access_cfg.write, false) ? var.dynamodb_write_actions : []
        )
      ]))
    }
  }

  lambdas_with_dynamodb_access = {
    for key, cfg in local.lambda_dynamodb_policy_candidates : key => cfg
    if length(cfg.table_arns) > 0 && length(cfg.actions) > 0
  }

  lambda_s3_policy_candidates = {
    for key, lambda_cfg in var.lambdas : key => {
      bucket_arns = distinct(concat(
        [
          for _, access_cfg in try(lambda_cfg.s3_access, {}) : access_cfg.s3_arn
          if try(access_cfg.read, false) || try(access_cfg.write, false)
        ]
      ))

      actions = distinct(concat(
        flatten([
          for _, access_cfg in try(lambda_cfg.s3_access, {}) : concat(
            try(access_cfg.read, false) ? var.s3_read_actions : [],
            try(access_cfg.write, false) ? var.s3_write_actions : []
          )
        ])
      ))
    }
  }

  lambdas_with_s3_access = {
    for key, cfg in local.lambda_s3_policy_candidates : key => cfg
    if length(cfg.bucket_arns) > 0 && length(cfg.actions) > 0
  }
}

data "aws_iam_policy_document" "lambda_dynamodb_access" {
  for_each = local.lambdas_with_dynamodb_access

  statement {
    effect  = "Allow"
    actions = each.value.actions
    resources = distinct(concat(
      each.value.table_arns,
      [for arn in each.value.table_arns : "${arn}/index/*"]
    ))
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb_access" {
  for_each = local.lambdas_with_dynamodb_access

  name   = "${var.lambdas[each.key].name}-dynamodb-access"
  role   = aws_iam_role.lambda_execution[each.key].id
  policy = data.aws_iam_policy_document.lambda_dynamodb_access[each.key].json
}

data "aws_iam_policy_document" "lambda_s3_access" {
  for_each = local.lambdas_with_s3_access

  statement {
    effect  = "Allow"
    actions = each.value.actions
    resources = distinct(concat(
      each.value.bucket_arns,
      [for arn in each.value.bucket_arns : "${arn}/*"]
    ))
  }
}

resource "aws_iam_role_policy" "lambda_s3_access" {
  for_each = local.lambdas_with_s3_access

  name   = "${var.lambdas[each.key].name}-s3-access"
  role   = aws_iam_role.lambda_execution[each.key].id
  policy = data.aws_iam_policy_document.lambda_s3_access[each.key].json
}

module "lambdas" {
  for_each = var.lambdas
  source   = "../lambda-base"

  function_name         = each.value.name
  description           = try(each.value.description, null)
  source_dir            = each.value.source_dir
  handler               = each.value.handler
  runtime               = each.value.runtime
  memory_size           = each.value.memory_size
  timeout               = each.value.timeout
  role_arn              = aws_iam_role.lambda_execution[each.key].arn
  environment_variables = each.value.environment_variables
  publish               = each.value.publish
  tags                  = var.tags
}

module "api_gateway" {
  source = "../api-gateway-base"

  name                         = var.api_gateway.name
  description                  = var.api_gateway.description
  stage_name                   = var.api_gateway.stage_name
  access_log_enabled           = false
  access_log_retention_in_days = 14

  cors_configuration = {
    allow_origins  = var.api_gateway.cors_allow_origins
    allow_methods  = var.api_gateway.cors_allow_methods
    allow_headers  = var.api_gateway.cors_allow_headers
    expose_headers = var.api_gateway.cors_expose_headers
    max_age        = var.api_gateway.cors_max_age
  }

  jwt_authorizer = var.jwt_authorizer

  routes = {
    for route_name, route in var.api_gateway.routes : route_name => {
      route_key = route.route_key
      integration_uri = merge(
        { for key, lambda_module in module.lambdas : key => lambda_module.invoke_arn },
        { for key, config in var.additional_integrations : key => config.integration_uri }
      )[route.integration_key]
      payload_format_version = try(route.payload_format_version, "2.0")
      timeout_milliseconds   = try(route.timeout_milliseconds, 30000)
      authorization_type     = try(route.authorization_type, "NONE")
      authorizer_id          = try(route.authorizer_id, null)
      operation_name         = try(route.operation_name, null)
    }
  }

  tags = var.tags
}

resource "aws_lambda_permission" "allow_apigw_invoke" {
  for_each = merge(
    {
      for key, lambda_module in module.lambdas : key => {
        integration_uri = lambda_module.invoke_arn
        function_name   = lambda_module.lambda_function_name
      }
    },
    var.additional_integrations
  )

  statement_id  = "AllowApiGatewayInvoke${replace(replace(replace(each.key, "-", "_"), ".", "_"), "/", "_")}"
  action        = "lambda:InvokeFunction"
  function_name = each.value.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}
