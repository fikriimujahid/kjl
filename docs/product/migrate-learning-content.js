"use strict";

require("dotenv").config();

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const { getConfig } = require("./src/config");
const { batchWriteItems } = require("./src/dynamo");
const { loadProducts } = require("./src/products");
const { printSummary, printWarnings } = require("./src/reporting");
const { transformProductsToItems } = require("./src/transform");
const { collectUploads, uploadFiles } = require("./src/uploads");

async function runMigration() {
  const config = getConfig();

  console.log("Starting docs/product learning-content migration...");

  const productEntries = await loadProducts(config);
  const { readyEntries, uploads, warnings } = await collectUploads(productEntries, config);
  const products = readyEntries.map((entry) => entry.product);
  const { items, summary } = transformProductsToItems(products);

  console.log(`Prepared ${uploads.length} S3 uploads.`);
  console.log(`Prepared ${items.length} DynamoDB items.`);

  const s3Client = new S3Client({ region: config.awsRegion });
  const dynamoClient = new DynamoDBClient({ region: config.awsRegion });
  const docClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true
    }
  });

  await uploadFiles({
    s3Client,
    uploads,
    dryRun: config.dryRun
  });

  const writeResult = await batchWriteItems({
    docClient,
    tableName: config.tableName,
    items,
    maxRetries: config.maxRetries,
    dryRun: config.dryRun
  });

  printWarnings(warnings);
  printSummary({
    summary,
    uploadCount: uploads.length,
    insertedItems: writeResult.insertedItems,
    config
  });
}

if (require.main === module) {
  runMigration().catch((error) => {
    console.error("Migration failed.");
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  collectUploads,
  getConfig,
  loadProducts,
  runMigration,
  transformProductsToItems
};