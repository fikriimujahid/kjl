data "archive_file" "package" {
  type        = "zip"
  source_dir  = "${path.module}/dummy"
  output_path = "${path.root}/.build-${var.function_name}.zip"
}

resource "aws_lambda_function" "this" {
  function_name = var.function_name
  description   = var.description
  role          = var.role_arn
  runtime       = var.runtime
  handler       = var.handler

  filename         = data.archive_file.package.output_path
  source_code_hash = data.archive_file.package.output_base64sha256

  memory_size   = var.memory_size
  timeout       = var.timeout
  publish       = var.publish
  architectures = var.architectures
  layers        = var.layers

  environment {
    variables = var.environment_variables
  }

  # Lambda code is bootstrapped by Terraform only; CI/CD owns subsequent code updates.
  lifecycle {
    ignore_changes = [
      filename,
      source_code_hash
    ]
  }

  tags = var.tags
}
