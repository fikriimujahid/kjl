# Backend Service Template

This document defines the standard structure for every folder inside `backend/services`.

The goal is to make each service:

- easy for juniors to read and maintain
- consistent across domains
- secure by default
- small at the service layer, with reusable code moved into `backend/packages`

## Current Baseline In This Repo

The current services already show a useful direction:

- `auth-service` is closest to a clean layered layout with `config`, `handlers`, `services`, `repositories`, `schemas`, and `docs`
- `product-service` uses explicit handler names such as `getProductsHandler`, which is clearer for juniors
- `payment-service` has stronger application-layer separation with `use-cases`, but still keeps duplicated request/response/auth helpers locally

The main inconsistencies today are:

- handler file/function naming is mixed (`register.ts`, `createPayment.ts`, `getProductsHandler.ts`)
- some reusable HTTP/auth helpers exist both in services and in `packages`
- some services separate use cases, while others put orchestration directly in handlers
- logging and security behavior are not fully standardized

## Standard Service Layout

Use this structure for every new service.

```text
backend/services/<domain>-service/
  package.json
  tsconfig.json
  local-server.js
  .env.example
  src/
    handler.ts
    routes.ts
    config/
      env.ts
    handlers/
      createThingHandler.ts
      getThingHandler.ts
      listThingsHandler.ts
    schemas/
      createThingSchema.ts
      listThingsQuerySchema.ts
    use-cases/
      createThing.ts
      getThing.ts
      listThings.ts
    services/
      paymentGatewayClient.ts
      cognitoSessionService.ts
    repositories/
      thingRepository.ts
    models/
      thing.ts
    errors/
      applicationErrors.ts
      errorToResponse.ts
    docs/
      openapi.ts
      schemas.ts
  tests/
    unit/
    integration/
    fixtures/
```

## Required Files

`src/handler.ts`

- Lambda entrypoint only
- loads validated env once at module startup
- handles `OPTIONS` if the service is public HTTP
- dispatches by route key
- never contains business logic

`src/routes.ts`

- single source of truth for method, path, and route key
- every route constant must be declared here
- OpenAPI docs should read from the same route definitions where practical

`src/config/env.ts`

- validates environment variables using `@shared-utils/env`
- exports exactly one getter such as `getPaymentServiceEnv()`
- no direct `process.env.X` access outside this file

`src/handlers/*Handler.ts`

- parse request input
- call one use case
- translate result into HTTP response
- map known errors to safe API errors
- no repository access directly from handlers

`src/use-cases/*.ts`

- application/business orchestration
- coordinates repositories and external services
- contains authorization rules, invariants, and transactional flow
- returns plain domain data, not HTTP responses

`src/services/*.ts`

- wrappers around external systems such as Cognito, Midtrans, S3, other APIs
- no HTTP response shaping
- no route-specific logic

`src/repositories/*.ts`

- data access only
- use `@shared-dynamodb` for generic CRUD/query/scan helpers
- no HTTP concerns and no request parsing

`src/schemas/*.ts`

- runtime validation schemas for body, query, params, headers, webhook payloads
- schema names must match the operation they validate

`src/errors/*.ts`

- central error classes and one mapper from internal errors to API responses
- avoid repeating `try/catch` translation rules in every handler

`tests/`

- unit tests for use cases and pure helpers
- integration tests for handler + route behavior
- fixtures for stable test inputs

## Naming Conventions

Use the same naming rules in every service.

### Files

- service folder: `<domain>-service`
- TypeScript implementation files: `camelCase.ts`
- handler files: `<action>Handler.ts`
- use-case files: `<action>.ts`
- repository files: `<entity>Repository.ts`
- external client/service files: `<provider>Client.ts` or `<provider>Service.ts`
- schema files: `<action>Schema.ts` or `<action><Part>Schema.ts`
- error files: `<purpose>Error.ts` or grouped files such as `applicationErrors.ts`
- test files: `<unit>.test.ts`

Examples:

- `createPaymentHandler.ts`
- `createPayment.ts`
- `paymentRepository.ts`
- `midtransClient.ts`
- `createPaymentSchema.ts`

### Functions

- handler function: `<action>Handler`
- use case function: `<action>`
- repository methods: verb-first and data-focused, such as `getById`, `listByUserId`, `create`, `updateStatus`
- env getter: `get<Domain>ServiceEnv`
- error mapper: `mapErrorToResponse`

Examples:

- `createPaymentHandler(event)`
- `createPayment(input)`
- `getProductsHandler(event)`
- `getProductById(productId)`

### Types And Constants

- interfaces and types: `PascalCase`
- classes: `PascalCase`
- constants shared across a file or module: `UPPER_SNAKE_CASE` only when they are true constants
- route registry constant: `ROUTES`
- schema constant: `<action>Schema`
- do not prefix interfaces with `I`

## Control Flow Standard

Every request should follow the same path:

1. `handler.ts` receives the API Gateway event.
2. Route dispatch selects one handler.
3. The handler parses and validates request data.
4. The handler calls one use case.
5. The use case calls repositories and external services.
6. The handler returns a shared success or error response.

If a handler needs more than input parsing, one use case call, and response shaping, that is a signal to move logic down into `use-cases`.

## Recommended `handler.ts` Pattern

Prefer a route table over long `if` chains once a service has more than a few endpoints.

```ts
import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { getExampleServiceEnv } from "./config/env";
import { ROUTES } from "./routes";
import { createThingHandler } from "./handlers/createThingHandler";
import { getThingHandler } from "./handlers/getThingHandler";

getExampleServiceEnv();

const routeHandlers: Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
> = {
  [ROUTES.CREATE_THING.routeKey]: createThingHandler,
  [ROUTES.GET_THING.routeKey]: getThingHandler
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse(event);
  }

  const routeHandler = routeHandlers[event.routeKey ?? ""];

  if (!routeHandler) {
    return createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" });
  }

  return routeHandler(event);
};

export const main = handler;
```

## Security Baseline

Every service must follow these rules.

### Request And Response Security

- use `@shared-utils/response` for all HTTP responses so headers stay consistent
- never create service-local response helpers when shared helpers already exist
- return generic 5xx messages to clients; do not leak stack traces or provider internals
- validate body, params, query, and headers before executing business logic
- reject malformed JSON with a safe 400 response

### Authentication And Authorization

- extract authenticated user information through one shared helper, not per-service copies
- authorization rules belong in use cases, not only in handlers
- webhook endpoints must validate signatures before processing payloads
- keep token/cookie parsing centralized

### Logging

- log request metadata such as `routeKey`, `requestId`, and stable business identifiers
- never log secrets, tokens, passwords, cookies, or full request bodies by default
- do not log raw payment payloads unless fields are explicitly redacted

Use one shared logger from `backend/packages`, for example `@shared-utils/logger`, instead of service-local wrappers around `console`.

### Logging Standard

- emit structured JSON logs only
- every log entry must include `timestamp`, `level`, `service`, and `event`
- use stable context keys such as `requestId`, `routeKey`, `method`, `userId`, `orderId`, `statusCode`, and `durationMs`
- log once per failure boundary; avoid logging the same exception in handler, use case, and repository without adding new context
- repositories and provider clients should log operational metadata, not full payloads
- the shared logger must automatically redact sensitive keys such as `authorization`, `cookie`, `password`, `token`, `refreshToken`, `serverKey`, and `signatureKey`

### Recommended Log Events

- `request.received`
- `request.succeeded`
- `request.failed`
- `payment.midtrans.snap.request`
- `payment.midtrans.snap.response`
- `payment.midtrans.snap.rejected`
- `cognito.login.failed`
- `dynamodb.query.failed`

### Example Log Record

```json
{
  "timestamp": "2026-05-15T08:30:00.000Z",
  "level": "info",
  "service": "payment-service",
  "event": "request.received",
  "requestId": "req-123",
  "routeKey": "POST /api/payments/create",
  "method": "POST"
}
```

### Configuration

- all env vars must be validated at startup
- service code must not read `process.env` directly outside `config/env.ts`
- use secure defaults for cookie and CORS settings

### AWS And Infrastructure

- IAM permissions must follow least privilege per service
- every service should only receive the table, bucket, topic, or secret access it needs
- shared package usage must not hide unsafe broad permissions in infrastructure

## What Belongs In `backend/packages`

Move code to `backend/packages` when it is repeated, generic, and not owned by one business domain.

Keep code inside a service when it contains domain rules that only that service understands.

### Good Candidates For Shared Packages In This Repo

Move or consolidate these patterns:

- HTTP response builders into `@shared-utils/response`
- JSON body parsing into `@shared-utils/request`
- env schema parsing into `@shared-utils/env`
- cookie extraction and creation into `@shared-utils/cookies`
- request-safe logging helpers into `@shared-utils/logger`
- authenticated user extraction into a shared auth helper package or `@shared-utils/auth`
- common API error envelope types into `@shared-types`
- reusable DynamoDB access helpers into `@shared-dynamodb`
- reusable OpenAPI components into `@shared-swagger`

### Current Refactor Targets

Based on the current codebase, these are the clearest cleanup items:

- `services/payment-service/src/utils/request.ts` duplicates `packages/shared-utils/src/request.ts`
- `services/payment-service/src/utils/response.ts` duplicates `packages/shared-utils/src/response.ts`
- `services/payment-service/src/utils/auth.ts` should become a shared auth helper if other services need the same JWT-claim extraction
- `services/product-service/src/utils/logger.ts` should either move to a shared logger helper or stay local only if it remains truly product-specific

### Rule Of Thumb

If the same helper appears in two services, move it.

If the helper depends on business language such as payment, auth session, or product ownership, keep it inside the service unless it is a stable cross-service abstraction.

## Folders To Avoid By Default

Do not create a folder just because another service has one.

Only add these folders when justified:

- `middleware/` only if you truly have reusable handler wrappers
- `domain/` only if the service has enough rich domain objects to justify it
- `clients/` only when you want to distinguish provider SDK wrappers from internal service orchestration

For junior readability, fewer top-level concepts is better.

## Template Decision Rules

When adding new code, choose the destination with these rules:

- if it shapes HTTP, it belongs in `handlers` or shared HTTP utilities
- if it coordinates business flow, it belongs in `use-cases`
- if it talks to AWS or a third-party API, it belongs in `services` or `clients`
- if it reads or writes persistence, it belongs in `repositories`
- if it validates input, it belongs in `schemas`
- if it is reused across services, it belongs in `packages`

## Adoption Recommendation For Existing Services

Apply this template in this order:

1. Standardize handler naming to `<action>Handler.ts` and `<action>Handler` exports.
2. Move duplicated request/response/auth helpers into `backend/packages`.
3. Ensure every service has a `config/env.ts` with one env getter.
4. Introduce `use-cases/` for orchestration-heavy services and move business logic out of handlers.
5. Standardize error mapping through one `errorToResponse` module per service.
6. Add unit and integration tests using the same `tests/` layout.

## Recommended Canonical Reference

Use `auth-service` as the base for layering and package usage.

Use `payment-service` as the base for introducing `use-cases` and central error mapping.

Use `product-service` as the reminder that explicit handler names are easier for juniors than ambiguous action files.

The final template should combine the strongest part of each service, not copy any one service exactly.