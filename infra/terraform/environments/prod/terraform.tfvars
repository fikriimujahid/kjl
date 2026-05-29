# ============================================================================
# Common Variables
# ============================================================================
project_name = "kejepangdulu"
environment  = "prod"
tags = {
  Owner       = "platform-team"
  CostCenter  = "kjl"
  Project     = "kejepangdulu"
  Environment = "prod"
  ManagedBy   = "Terraform"
}

# ============================================================================
# Budget Module Variables
# ============================================================================
budget = {
  budget_name            = "kejepangdulu-prod-monthly-budget"
  monthly_budget_limit   = 10
  budget_alert_threshold = 80
  budget_alert_email     = "itsmefikri@gmail.com"
}

# ============================================================================
# Frontend Site Hosting Variables
# ============================================================================
frontend_site_hosting = {
  zone_id = "Z0641160BIPE40MMNCVP"
  # S3 STATIC HOSTING BUCKETS
  s3_static_hosting = {
    bucket_name = "kejepangdulu-prod-frontend-bucket"
  }

  # S3 CLOUDFRONT LOG
  s3_cloudfront_log = {
    bucket_name    = "kejepangdulu-prod-cloudfront-logs"
    lifecycle_days = 90
    lifecycle_rules = [
      {
        id      = "ExpireLogsAfter90Days"
        enabled = true
        expiration = {
          days = 90
        }
      }
    ]
  }

  # ACM CONFIGURATION
  acm = {
    domain_name               = "kejepangdulu.click"
    subject_alternative_names = ["*.kejepangdulu.click"]
    zone_id                   = "Z0641160BIPE40MMNCVP"
    #existing_certificate_arn = "arn:aws:acm:us-east-1:731099197523:certificate/adba9bcc-d4b9-4b1b-8bb7-204de0c57120"
  }

  # CLOUDFRONT CONFIGURATION
  cloudfront = {
    aliases = ["kejepangdulu.click"]
    rewrite_config = {
      extension_index_rules = [
        {
          extension  = ".txt"
          index_file = "index.txt"
        }
      ]
    }
    custom_error_responses = [
      {
        error_code            = 403
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 0
      },
      {
        error_code            = 404
        response_code         = 404
        response_page_path    = "/404.html"
        error_caching_min_ttl = 0
      }
    ]
  }
}

# -------------------------------------------------------------------------
# COGNITO AUTH MODULE
# -------------------------------------------------------------------------
auth_cognito = {
  callback_urls = [
    "https://dev.myapp.com/auth/callback"
  ]

  logout_urls = [
    "https://dev.myapp.com/logout"
  ]

  token_validity = {
    access_token_validity  = 1
    id_token_validity      = 1
    refresh_token_validity = 30
    token_validity_units = {
      access_token  = "hours"
      id_token      = "hours"
      refresh_token = "days"
    }
  }

  user_pool_schema_attributes = [
    {
      name                = "email"
      attribute_data_type = "String"
      required            = true
      mutable             = true
      string_attribute_constraints = {
        min_length = 5
        max_length = 2048
      }
    },
    {
      name                = "name"
      attribute_data_type = "String"
      required            = false
      mutable             = true
      string_attribute_constraints = {
        min_length = 1
        max_length = 2048
      }
    },
    {
      name                = "last_checkin_date"
      attribute_data_type = "String"
      required            = false
      mutable             = true
      string_attribute_constraints = {
        min_length = 10
        max_length = 10
      }
    }
  ]

  enabled_identity_providers = ["COGNITO"]
  verification_message_template = {
    default_email_option  = "CONFIRM_WITH_LINK"
    email_subject_by_link = "Verifikasi email akun KeJepangDulu"
    email_message_by_link = <<-EOT
      <!DOCTYPE html>
      <html lang="id">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

              <!-- Header -->
              <tr><td align="center" style="padding:0 0 24px 0;">
                <span style="font-size:22px;font-weight:700;color:#1a1a2e;letter-spacing:-0.5px;">KeJepang<span style="color:#e63946;">Dulu</span></span>
              </td></tr>

              <!-- Card -->
              <tr><td style="background:#ffffff;border-radius:16px;padding:40px 40px 32px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

                <!-- Icon -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:24px;">
                  <div style="width:64px;height:64px;background:#fff0f1;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:28px;">&#9993;</div>
                </td></tr></table>

                <!-- Title -->
                <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1a1a2e;text-align:center;">Verifikasi Email Kamu</h1>

                <!-- Body -->
                <p style="margin:0 0 8px;font-size:15px;color:#555;text-align:center;line-height:1.6;">Halo, selamat datang di <strong>KeJepangDulu</strong>!</p>
                <p style="margin:0 0 32px;font-size:15px;color:#555;text-align:center;line-height:1.6;">Satu langkah lagi — klik tombol di bawah untuk mengaktifkan akun dan mulai belajar bahasa Jepang.</p>

                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding-bottom:32px;">
                  {##Click Here##}
                </td></tr></table>

                <!-- Divider -->
                <hr style="border:none;border-top:1px solid #f0f0f0;margin:0 0 24px;">

                <!-- Disclaimer -->
                <p style="margin:0;font-size:13px;color:#aaa;text-align:center;line-height:1.5;">Jika kamu tidak merasa membuat akun ini, kamu bisa mengabaikan email ini dengan aman.</p>
              </td></tr>

              <!-- Footer -->
              <tr><td align="center" style="padding:24px 0 0;">
                <p style="margin:0;font-size:12px;color:#bbb;">&copy; 2026 KeJepangDulu. All rights reserved.</p>
              </td></tr>

            </table>
          </td></tr>
        </table>
      </body>
      </html>
    EOT
  }
}

# ============================================================================
# GitHub CICD Variables
# ============================================================================
github_cicd = {
  github_repo              = "fikriimujahid/kjl"
  branches                 = ["prod"]
  github_oidc_provider_arn = "arn:aws:iam::731099197523:oidc-provider/token.actions.githubusercontent.com"
  role_name                = "kejepangdulu-prod-github-oidc-role"
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
    "arn:aws:iam::aws:policy/CloudFrontFullAccess",
    "arn:aws:iam::aws:policy/AWSLambda_FullAccess"
  ]
}

# ============================================================================
# Service API Variables
# ============================================================================
service_api = {
  lambdas = {
    product = {
      name                  = "kejepangdulu-prod-product-api"
      description           = "Public Product API Lambda."
      source_dir            = "../../../../backend/services/product-service/build/lambda"
      handler               = "services/product-service/src/handler.handler"
      runtime               = "nodejs22.x"
      memory_size           = 256
      timeout               = 10
      environment_variables = {}
      publish               = true
      dynamodb_access = {
        product_table = {
          table_arn = "arn:aws:dynamodb:ap-southeast-1:731099197523:table/kjl-products-prod"
          read      = true
          write     = true
        }
      }
      s3_access = {
        media_private = {
          s3_arn = "arn:aws:s3:::kejepangdulu-prod-media-private"
          read   = true
          write  = false
        }
      }
    }

    learning = {
      name                  = "kejepangdulu-prod-learning-api"
      description           = "Private Learning Content API Lambda."
      source_dir            = "../../../../backend/services/learning-service/build/lambda"
      handler               = "services/learning-service/src/handler.handler"
      runtime               = "nodejs22.x"
      memory_size           = 256
      timeout               = 10
      environment_variables = {}
      publish = true
      dynamodb_access = {
        progress_table = {
          table_arn = "arn:aws:dynamodb:ap-southeast-1:731099197523:table/kjl-progress-prod"
          read      = true
          write     = true
        }
      }
      s3_access = {
        media_private = {
          s3_arn = "arn:aws:s3:::kejepangdulu-prod-media-private"
          read   = true
          write  = false
        }
      }
    }

    payment = {
      name                  = "kejepangdulu-prod-payment-api"
      description           = "Midtrans Payment API Lambda."
      source_dir            = "../../../../backend/services/payment-service/build/lambda"
      handler               = "services/payment-service/src/handler.handler"
      runtime               = "nodejs22.x"
      memory_size           = 256
      timeout               = 15
      environment_variables = {}
      publish               = true
      dynamodb_access = {
        payments_table = {
          table_arn = "arn:aws:dynamodb:ap-southeast-1:731099197523:table/kjl-payments-prod"
          read      = true
          write     = true
        }
      }
    }

    auth = {
      name                  = "kejepangdulu-prod-auth-api"
      description           = "Auth API Lambda."
      source_dir            = "../../../../backend/services/auth-service/build/lambda"
      handler               = "services/auth-service/src/handler.handler"
      runtime               = "nodejs22.x"
      memory_size           = 256
      timeout               = 15
      environment_variables = {
        DYNAMO_DB_TABLE_NAME = "kjl-progress-prod"
      }
      publish               = true
      dynamodb_access = {
        progress_table = {
          table_arn = "arn:aws:dynamodb:ap-southeast-1:731099197523:table/kjl-progress-prod"
          read      = true
          write     = true
        }
      }
    }
  }

  api_gateway = {
    name        = "kejepangdulu-prod-service-api"
    description = "Service API."
    stage_name  = "$default"

    cors_allow_origins  = ["*"]
    cors_allow_methods  = ["GET", "POST", "OPTIONS"]
    cors_allow_headers  = ["content-type", "authorization", "x-internal-api-key"]
    cors_expose_headers = []
    cors_max_age        = 300

    routes = {
      list_products_under_api = {
        route_key          = "GET /api/products"
        authorization_type = "NONE"
        operation_name     = "ListProductsUnderApi"
        integration_key    = "product"
      }
      get_product_by_id_under_api = {
        route_key          = "GET /api/products/{id}"
        authorization_type = "NONE"
        operation_name     = "GetProductByIdUnderApi"
        integration_key    = "product"
      }
      get_owned_products_by_user_under_api = {
        route_key          = "GET /api/payments/owned/{userId}"
        authorization_type = "JWT"
        operation_name     = "GetOwnedProductsByUserUnderApi"
        integration_key    = "payment"
      }
      get_internal_owned_products_by_user_under_api = {
        route_key          = "GET /api/internal/payments/owned/{userId}"
        authorization_type = "NONE"
        operation_name     = "GetInternalOwnedProductsByUserUnderApi"
        integration_key    = "payment"
      }
      get_internal_product_summary_under_api = {
        route_key          = "GET /api/internal/products/{id}/summary"
        authorization_type = "NONE"
        operation_name     = "GetInternalProductSummaryUnderApi"
        integration_key    = "product"
      }
      get_internal_session_by_id_under_api = {
        route_key          = "GET /api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}"
        authorization_type = "NONE"
        operation_name     = "GetInternalSessionByIdUnderApi"
        integration_key    = "product"
      }
      get_learning_session_images_under_api = {
        route_key          = "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images"
        authorization_type = "JWT"
        operation_name     = "GetLearningSessionImagesUnderApi"
        integration_key    = "learning"
      }
      get_learning_session_questions_under_api = {
        route_key          = "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions"
        authorization_type = "JWT"
        operation_name     = "GetLearningSessionQuestionsUnderApi"
        integration_key    = "learning"
      }
      check_learning_session_answer_under_api = {
        route_key          = "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check"
        authorization_type = "JWT"
        operation_name     = "CheckLearningSessionAnswerUnderApi"
        integration_key    = "learning"
      }
      start_learning_session_attempt_under_api = {
        route_key          = "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start"
        authorization_type = "JWT"
        operation_name     = "StartLearningSessionAttemptUnderApi"
        integration_key    = "learning"
      }
      get_learning_session_attempts_under_api = {
        route_key          = "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts"
        authorization_type = "JWT"
        operation_name     = "GetLearningSessionAttemptsUnderApi"
        integration_key    = "learning"
      }
      finish_learning_session_attempt_under_api = {
        route_key          = "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish"
        authorization_type = "JWT"
        operation_name     = "FinishLearningSessionAttemptUnderApi"
        integration_key    = "learning"
      }
      get_learning_session_attempt_progress_under_api = {
        route_key          = "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
        authorization_type = "JWT"
        operation_name     = "GetLearningSessionAttemptProgressUnderApi"
        integration_key    = "learning"
      }
      save_learning_session_attempt_progress_under_api = {
        route_key          = "PUT /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
        authorization_type = "JWT"
        operation_name     = "SaveLearningSessionAttemptProgressUnderApi"
        integration_key    = "learning"
      }
      create_payment_under_api = {
        route_key          = "POST /api/payments/create"
        authorization_type = "JWT"
        operation_name     = "CreatePaymentUnderApi"
        integration_key    = "payment"
      }
      get_payment_history_under_api = {
        route_key          = "GET /api/payments/history"
        authorization_type = "JWT"
        operation_name     = "GetPaymentHistoryUnderApi"
        integration_key    = "payment"
      }
      payment_webhook_under_api = {
        route_key          = "POST /api/payments/webhook"
        authorization_type = "NONE"
        operation_name     = "PaymentWebhookUnderApi"
        integration_key    = "payment"
      }
      register_under_api = {
        route_key          = "POST /api/auth/register"
        authorization_type = "NONE"
        operation_name     = "RegisterUnderApi"
        integration_key    = "auth"
      }
      login_under_api = {
        route_key          = "POST /api/auth/login"
        authorization_type = "NONE"
        operation_name     = "LoginUnderApi"
        integration_key    = "auth"
      }
      refresh_session_under_api = {
        route_key          = "POST /api/auth/refresh"
        authorization_type = "NONE"
        operation_name     = "RefreshSessionUnderApi"
        integration_key    = "auth"
      }
      forgot_password_under_api = {
        route_key          = "POST /api/auth/forgot-password"
        authorization_type = "NONE"
        operation_name     = "ForgotPasswordUnderApi"
        integration_key    = "auth"
      }
      confirm_forgot_password_under_api = {
        route_key          = "POST /api/auth/forgot-password/confirm"
        authorization_type = "NONE"
        operation_name     = "ConfirmForgotPasswordUnderApi"
        integration_key    = "auth"
      }
      get_session_under_api = {
        route_key          = "GET /api/auth/session"
        authorization_type = "NONE"
        operation_name     = "GetSessionUnderApi"
        integration_key    = "auth"
      }
      post_checkin_under_api = {
        route_key          = "POST /api/auth/checkin"
        authorization_type = "JWT"
        operation_name     = "PostCheckinUnderApi"
        integration_key    = "auth"
      }
      get_checkin_under_api = {
        route_key          = "GET /api/auth/checkin"
        authorization_type = "JWT"
        operation_name     = "GetCheckinUnderApi"
        integration_key    = "auth"
      }
      logout_under_api = {
        route_key          = "POST /api/auth/logout"
        authorization_type = "NONE"
        operation_name     = "LogoutUnderApi"
        integration_key    = "auth"
      }
    }
  }
  cloudfront_path_pattern = "/api/*"
}

# ============================================================================
# Products DynamoDB Table Variables
# ============================================================================
products_table = {
  table_name   = "kjl-products-prod"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    }
  ]

  global_secondary_indexes       = []
  ttl_enabled                    = false
  ttl_attribute_name             = null
  point_in_time_recovery_enabled = true
  server_side_encryption_enabled = true
}

# ============================================================================
# Payments DynamoDB Table Variables
# ============================================================================
payments_table = {
  table_name   = "kjl-payments-prod"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    }
  ]

  global_secondary_indexes       = []
  ttl_enabled                    = false
  ttl_attribute_name             = null
  point_in_time_recovery_enabled = true
  server_side_encryption_enabled = true
}

# ============================================================================
# DynamoDB Progress Table Variables
# ============================================================================
progress_table = {
  table_name   = "kjl-progress-prod"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "PK"
  range_key    = "SK"

  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    }
  ]

  global_secondary_indexes       = []
  ttl_enabled                    = false
  ttl_attribute_name             = null
  point_in_time_recovery_enabled = true
  server_side_encryption_enabled = true
}