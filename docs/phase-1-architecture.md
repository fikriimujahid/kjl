# Phase 1 - Core API Foundation Architecture

## 1. Overview

Phase 1 introduces a reusable API foundation for the existing serverless platform.

Implemented outcomes:
- API Gateway HTTP API is provisioned by Terraform.
- Product Lambda is provisioned by Terraform.
- Public endpoints are available with no authentication:
  - GET /products
  - GET /products/{id}
- CloudFront now forwards /api/* traffic to API Gateway while preserving existing static and public-data behavior.
- GitHub Actions automatically builds and deploys product Lambda code on push to main for product-service changes.

## 2. Terraform Module Architecture

New modules:
- modules/api-gateway-base
- modules/lambda-base
- modules/product-api

### 2.1 api-gateway-base (generic)

Responsibilities:
- Create API Gateway v2 HTTP API.
- Create stage (default: $default) with auto deploy.
- Configure CORS.
- Register routes and integrations from a route map.

Outputs:
- api_id
- api_endpoint
- execution_arn

### 2.2 lambda-base (generic)

Responsibilities:
- Package Lambda source directory into zip.
- Create Lambda function.
- Configure runtime, memory, timeout, role, environment variables, version publishing.

Outputs:
- lambda_function_name
- lambda_arn
- invoke_arn

### 2.3 product-api (domain specific)

Responsibilities:
- Create Lambda execution IAM role and attach basic execution policy.
- Instantiate lambda-base for product handler deployment.
- Instantiate api-gateway-base and register:
  - GET /products
  - GET /products/{id}
- Grant API Gateway invoke permission to Lambda.

Outputs:
- Product API endpoint and API metadata.
- Product Lambda function metadata.
- API Gateway origin details for CloudFront integration.

## 3. Environment Composition

Both environments were updated:
- infra/terraform/environments/dev
- infra/terraform/environments/prod

Each environment now composes module product_api and passes its outputs into static-hosting CloudFront settings.

New environment variable object:
- product_api

Configurable settings include:
- Lambda source directory
- Lambda function override
- memory and timeout
- API name and stage
- CORS configuration
- CloudFront path pattern (default /api/*)

## 4. CloudFront API Routing

CloudFront was not recreated.

The existing static-hosting module was extended to support an optional api_origin custom origin.

Routing behavior:
- /api/* -> API Gateway custom origin
- /public-data/* -> existing public bucket behavior
- default -> existing frontend S3 origin

Key points:
- Existing static behavior remains unchanged.
- API behavior uses a managed no-cache policy and forwards required request context to API Gateway.

## 5. Lambda Service Design

New backend service path:
- backend/services/product-service

Structure:
- src/handlers/getProducts.ts
- src/handlers/getProductDetails.ts
- src/models/product.ts
- src/services/productService.ts
- src/utils/response.ts
- src/handler.ts
- package.json
- tsconfig.json

Behavior:
- GET /products returns mock product summaries.
- GET /products/{id} returns product details with description.
- Missing ID returns 400.
- Unknown product returns 404.

A runtime-compatible fallback handler exists at backend/services/product-service/lambda/handler.js for Terraform packaging by default.

## 6. CI/CD Deployment Flow

Workflow file:
- .github/workflows/product-service-lambda-deploy.yml

Trigger:
- push to main
- only when backend/services/product-service/** or the workflow file changes

Pipeline steps:
1. Checkout code.
2. Setup Node.js.
3. Install dependencies.
4. Build TypeScript.
5. Package Lambda zip.
6. Upload artifact.
7. Configure AWS credentials from GitHub Secrets.
8. Deploy with aws lambda update-function-code.

Required GitHub Secrets:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION
- PRODUCT_SERVICE_LAMBDA_FUNCTION_NAME

## 7. Deployment Notes

Terraform deploy path:
- Apply environment root (dev or prod) after terraform init.
- product_api module provisions API Gateway and Lambda infrastructure.
- static-hosting module extends CloudFront with /api/* behavior.

Code deploy path:
- GitHub Actions updates Lambda code independently of Terraform using update-function-code.
- This separation allows faster code-only deployments without infrastructure reprovisioning.
