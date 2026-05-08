"use strict";

require("dotenv").config();

const fs = require("node:fs/promises");
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const { getConfig } = require("./src/config");
const { validateProductsJson } = require("./src/validate");
const { transformProductsToItems } = require("./src/transform");
const { batchWriteItems } = require("./src/dynamoBatchWriter");

async function readInputJson(inputFile) {
  let raw;

  try {
    raw = await fs.readFile(inputFile, "utf8");
  } catch (error) {
    throw new Error(`Failed to read JSON file at ${inputFile}: ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Input file is not valid JSON: ${error.message}`);
  }
}

function extractProducts(payload) {
  // Support both supported shapes: [] and { products: [] }.
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.products)) {
    return payload.products;
  }

  throw new Error("Input JSON must be an array or an object with a products array.");
}

function printSummary(summary, insertedItems) {
  console.log("\nMigration summary");
  console.log(`- total products: ${summary.totalProducts}`);
  console.log(`- total topics: ${summary.totalTopics}`);
  console.log(`- total sessions: ${summary.totalSessions}`);
  console.log(`- total inserted items: ${insertedItems}`);
}

async function runMigration() {
  const config = getConfig();

  console.log("Starting learning-content migration...");
  console.log(`- region: ${config.awsRegion}`);
  console.log(`- table: ${config.tableName}`);
  console.log(`- input file: ${config.inputFile}`);

  const payload = await readInputJson(config.inputFile);
  const products = extractProducts(payload);

  validateProductsJson(products);

  const { items, summary } = transformProductsToItems(products);
  console.log(`Prepared ${items.length} items for DynamoDB.`);

  // Document client keeps write code simple while still using AWS SDK v3.
  const dynamoClient = new DynamoDBClient({ region: config.awsRegion });
  const documentClient = DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });

  const writeResult = await batchWriteItems({
    docClient: documentClient,
    tableName: config.tableName,
    items,
    maxRetries: config.maxRetries,
  });

  printSummary(summary, writeResult.insertedItems);
  console.log("Migration completed successfully.");
}

runMigration().catch((error) => {
  console.error("Migration failed.");
  console.error(error.message);
  process.exitCode = 1;
});
