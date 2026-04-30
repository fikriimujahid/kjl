locals {
  name_prefix          = "${var.project_name}-${var.environment}"
  lambda_function_name = coalesce(var.lambda_function_name, "${local.name_prefix}-${var.service_name}-api")
  api_name             = coalesce(var.api_name, "${local.name_prefix}-${var.service_name}-api")

  tags = merge({
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Module      = "service-api"
  }, var.tags)
}

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
  name               = "${local.name_prefix}-${var.service_name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

module "product_lambda" {
  source = "../lambda-base"

  function_name         = local.lambda_function_name
  description           = var.lambda_description
  source_dir            = var.lambda_source_dir
  handler               = var.lambda_handler
  runtime               = var.lambda_runtime
  memory_size           = var.lambda_memory_size
  timeout               = var.lambda_timeout
  role_arn              = aws_iam_role.lambda_execution.arn
  environment_variables = var.lambda_environment_variables
  publish               = var.lambda_publish
  tags                  = local.tags
}

module "api_gateway" {
  source = "../api-gateway-base"

  name        = local.api_name
  description = var.api_description
  stage_name  = var.api_stage_name

  cors_configuration = {
    allow_origins  = var.cors_allow_origins
    allow_methods  = var.cors_allow_methods
    allow_headers  = var.cors_allow_headers
    expose_headers = var.cors_expose_headers
    max_age        = var.cors_max_age
  }

  routes = {
    for route_name, route in var.routes : route_name => {
      route_key              = route.route_key
      integration_uri        = module.product_lambda.invoke_arn
      payload_format_version = try(route.payload_format_version, "2.0")
      timeout_milliseconds   = try(route.timeout_milliseconds, var.integration_timeout_milliseconds)
      authorization_type     = try(route.authorization_type, "NONE")
      authorizer_id          = try(route.authorizer_id, null)
      operation_name         = try(route.operation_name, null)
    }
  }

  tags = local.tags
}

resource "aws_lambda_permission" "allow_apigw_invoke" {
  statement_id  = "AllowApiGatewayInvokeServiceApi"
  action        = "lambda:InvokeFunction"
  function_name = module.product_lambda.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}
