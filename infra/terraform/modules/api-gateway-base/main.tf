resource "aws_apigatewayv2_api" "this" {
  name                       = var.name
  description                = var.description
  protocol_type              = var.protocol_type
  route_selection_expression = var.route_selection_expression

  dynamic "cors_configuration" {
    for_each = var.cors_configuration == null ? [] : [var.cors_configuration]

    content {
      allow_credentials = try(cors_configuration.value.allow_credentials, false)
      allow_headers     = try(cors_configuration.value.allow_headers, ["content-type", "authorization"])
      allow_methods     = try(cors_configuration.value.allow_methods, ["GET", "OPTIONS"])
      allow_origins     = try(cors_configuration.value.allow_origins, ["*"])
      expose_headers    = try(cors_configuration.value.expose_headers, [])
      max_age           = try(cors_configuration.value.max_age, 300)
    }
  }

  tags = var.tags
}

resource "aws_cloudwatch_log_group" "api_access" {
  count = var.access_log_enabled ? 1 : 0

  name              = "/aws/apigateway/${var.name}-${replace(var.stage_name, "$", "")}"
  retention_in_days = var.access_log_retention_in_days
  tags              = var.tags
}

resource "aws_apigatewayv2_stage" "this" {
  api_id      = aws_apigatewayv2_api.this.id
  name        = var.stage_name
  auto_deploy = var.auto_deploy

  dynamic "access_log_settings" {
    for_each = var.access_log_enabled ? [1] : []

    content {
      destination_arn = aws_cloudwatch_log_group.api_access[0].arn
      format          = var.access_log_format
    }
  }

  tags = var.tags
}

resource "aws_apigatewayv2_integration" "this" {
  for_each = var.routes

  api_id                 = aws_apigatewayv2_api.this.id
  integration_type       = try(each.value.integration_type, "AWS_PROXY")
  integration_uri        = each.value.integration_uri
  integration_method     = try(each.value.integration_method, "POST")
  payload_format_version = try(each.value.payload_format_version, "2.0")
  timeout_milliseconds   = try(each.value.timeout_milliseconds, 30000)
}

resource "aws_apigatewayv2_route" "this" {
  for_each = var.routes

  api_id             = aws_apigatewayv2_api.this.id
  route_key          = each.value.route_key
  target             = "integrations/${aws_apigatewayv2_integration.this[each.key].id}"
  authorization_type = try(each.value.authorization_type, "NONE")
  authorizer_id      = try(each.value.authorizer_id, null)
  operation_name     = try(each.value.operation_name, null)
}
