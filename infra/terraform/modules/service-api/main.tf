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
  name               = "${var.lambda.name}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = var.tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_dynamodb_query" {
  count = length(var.dynamodb_table_arns) > 0 ? 1 : 0

  statement {
    effect = "Allow"
    actions = [
      "dynamodb:Query"
    ]
    resources = concat(
      var.dynamodb_table_arns,
      [for arn in var.dynamodb_table_arns : "${arn}/index/*"]
    )
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb_query" {
  count = length(var.dynamodb_table_arns) > 0 ? 1 : 0

  name   = "${var.lambda.name}-dynamodb-query"
  role   = aws_iam_role.lambda_execution.id
  policy = data.aws_iam_policy_document.lambda_dynamodb_query[0].json
}

module "product_lambda" {
  source = "../lambda-base"

  function_name         = var.lambda.name
  description           = var.lambda.description
  source_dir            = var.lambda.source_dir
  handler               = var.lambda.handler
  runtime               = var.lambda.runtime
  memory_size           = var.lambda.memory_size
  timeout               = var.lambda.timeout
  role_arn              = aws_iam_role.lambda_execution.arn
  environment_variables = var.lambda.environment_variables
  publish               = var.lambda.publish
  tags                  = var.tags
}

module "api_gateway" {
  source = "../api-gateway-base"

  name                         = var.api_gateway.name
  description                  = var.api_gateway.description
  stage_name                   = var.api_gateway.stage_name
  access_log_enabled           = true
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
      route_key              = route.route_key
      integration_uri        = module.product_lambda.invoke_arn
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
  statement_id  = "AllowApiGatewayInvokeServiceApi"
  action        = "lambda:InvokeFunction"
  function_name = module.product_lambda.lambda_function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${module.api_gateway.execution_arn}/*/*"
}
