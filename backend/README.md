# Backend Monorepo

This backend is organized as a workspace monorepo to keep service logic isolated while sharing reusable infrastructure modules.

## Structure

- `packages/`
  - `shared-utils`: HTTP response helpers, request parsing, cookies, env validation.
  - `shared-types`: shared API envelope types.
  - `shared-dynamodb`: generic DynamoDB v3 client + CRUD/repository foundation.
  - `shared-swagger`: OpenAPI 3 reusable schemas and generation helpers.
- `services/`
  - `auth-service`: auth Lambda handlers and service-owned endpoint docs.
  - `product-service`: product Lambda handlers and service-owned endpoint docs.

See `SERVICE_TEMPLATE.md` for the standard folder layout, naming rules, security baseline, and shared-package extraction guidance for all backend services.

## Local Setup

1. Open terminal at `backend/`.
2. Install dependencies for all workspaces:

```bash
npm install
```

3. Start auth-service locally:

```bash
npm run start:local --workspace auth-service
```

Auth service keeps its local env template at `services/auth-service/.env.example`.

## Testing

Run auth-service tests:

```bash
npm run test:auth
```

Watch mode:

```bash
npm run test:watch --workspace auth-service
```

Test folders in auth-service:

- `tests/unit`
- `tests/integration`
- `tests/mocks`

## TypeScript Config

- Root config: `tsconfig.base.json`.
- Service configs extend the root config.
- Shared aliases:
  - `@shared-utils/*`
  - `@shared-types/*`
  - `@shared-dynamodb/*`
  - `@shared-swagger/*`

## Shared Package Usage

Auth handlers import reusable infra code from shared packages, for example:

```ts
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { parseEventBody } from "@shared-utils/request";
import { loginWithPassword } from "./src/services/cognito";
```

## Swagger/OpenAPI Generation

Service endpoint docs stay inside each service:

- Auth: `services/auth-service/src/docs`
- Product: `services/product-service/src/docs`

Shared swagger package only provides reusable components and generation helpers.

Example auth generation flow:

```ts
import { buildAuthServiceOpenApi, generateAuthServiceOpenApiJson } from "./src/docs";

const document = buildAuthServiceOpenApi();
const openApiJson = generateAuthServiceOpenApiJson();
```

Generate auth swagger JSON:

```bash
npm run swagger:auth
```

Generate product swagger JSON:

```bash
npm run swagger:product
```

Outputs:

- `services/auth-service/openapi/swagger.json`
- `services/product-service/openapi/swagger.json`

## DynamoDB Foundation Example

`shared-dynamodb` provides a typed `BaseRepository<TItem, TKey>` with reusable methods:

- `create`
- `update`
- `delete`
- `get`
- `query`
- `scan`

Example usage:

```ts
import { BaseRepository, createDynamoDocumentClient } from "@shared-dynamodb/index";

type User = { pk: string; sk: string; email: string };
type UserKey = Pick<User, "pk" | "sk">;

class UserRepository extends BaseRepository<User, UserKey> {}

const repository = new UserRepository("users-table", createDynamoDocumentClient());
```

## Architecture Rules

- Handlers: parse request, validate input, return response formatting.
- Services: external integrations (Cognito/JWT/AWS).
- Repositories: data access only.
- Shared packages: reusable infrastructure only (service-specific auth integration is now local to auth-service).

Business logic should remain inside each service.
