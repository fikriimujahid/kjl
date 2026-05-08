# Learning Content DynamoDB Migration

Standalone Node.js script to migrate learning content JSON into a DynamoDB single table.

## Scope

This package only performs data migration into DynamoDB.

- No API Gateway
- No Lambda
- No Terraform
- No frontend changes

## Target Table

- Table name is loaded from environment variable `DYNAMODB_TABLE_NAME`
- For your case, use `learning-content-dev`

## Data Model

Each entity is stored as a separate item with `entityType`:

- `PRODUCT`
- `TOPIC`
- `SESSION`

Key patterns used:

- Product metadata item:
  - `PK = PRODUCT#{productId}`
  - `SK = METADATA`
- Topic item:
  - `PK = PRODUCT#{productId}`
  - `SK = TOPIC#{topicId}`
- Session item:
  - `PK = TOPIC#{productId}#{topicId}`
  - `SK = SESSION#{sessionId}`

Note: Topic IDs in the provided JSON are reused across products (example: `t0`, `tIntro`), so session partition keys are namespaced with `productId` to avoid collisions.

## Features

- Validates JSON structure before writing
- Transforms products, topics, and sessions into single-table items
- Uses `BatchWriteItem` with 25-item chunks
- Retries unprocessed items with exponential backoff and jitter
- Prints migration summary:
  - total products
  - total topics
  - total sessions
  - total inserted items

## Input JSON

Default input file is resolved automatically to:

`frontend/web/public/public-data/product.json` (from workspace root)

Accepted JSON shapes:

- An array of products
- An object containing `products` array

You can override via:

- First CLI argument: `node migrate-learning-content.js path/to/file.json`
- Or env var: `INPUT_FILE=path/to/file.json`

## Setup And Run

```bash
npm install
cp .env.example .env
node migrate-learning-content.js
```

On Windows PowerShell, if `cp` is unavailable:

```powershell
Copy-Item .env.example .env
```

You can also run:

```bash
npm run migrate
```

## Environment Variables

Required:

- `AWS_REGION`
- `DYNAMODB_TABLE_NAME`

Optional:

- `INPUT_FILE`
- `MAX_RETRIES` (default: `5`)

## Example Output

```text
Starting learning-content migration...
- region: ap-southeast-1
- table: learning-content-dev
- input file: .../product.json
Prepared 95 items for DynamoDB.
Inserted batch 1/4 (25 items).
Inserted batch 2/4 (25 items).
Inserted batch 3/4 (25 items).
Inserted batch 4/4 (20 items).

Migration summary
- total products: 2
- total topics: 14
- total sessions: 79
- total inserted items: 95
Migration completed successfully.
```
