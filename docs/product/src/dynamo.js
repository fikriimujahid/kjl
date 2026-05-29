"use strict";

const { BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

const MAX_BATCH_SIZE = 25;

function chunkArray(array, size) {
  const chunks = [];

  for (let index = 0; index < array.length; index += size) {
    chunks.push(array.slice(index, index + size));
  }

  return chunks;
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getRetryDelayMs(attempt) {
  const baseDelay = 200;
  const jitter = Math.floor(Math.random() * 100);
  return baseDelay * (2 ** attempt) + jitter;
}

async function writeBatchWithRetry({ docClient, tableName, items, maxRetries }) {
  let pendingRequests = items.map((item) => ({
    PutRequest: {
      Item: item
    }
  }));

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: pendingRequests
        }
      })
    );

    pendingRequests = response.UnprocessedItems?.[tableName] ?? [];

    if (pendingRequests.length === 0) {
      return;
    }

    if (attempt === maxRetries) {
      break;
    }

    await delay(getRetryDelayMs(attempt));
  }

  throw new Error(
    `Failed to process ${pendingRequests.length} unprocessed items after ${maxRetries + 1} attempts.`
  );
}

async function batchWriteItems({ docClient, tableName, items, maxRetries, dryRun }) {
  const batches = chunkArray(items, MAX_BATCH_SIZE);
  let insertedItems = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];

    if (dryRun) {
      insertedItems += batch.length;
      console.log(`[dry-run] batch write ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
      continue;
    }

    await writeBatchWithRetry({
      docClient,
      tableName,
      items: batch,
      maxRetries
    });

    insertedItems += batch.length;
    console.log(`Inserted batch ${batchIndex + 1}/${batches.length} (${batch.length} items).`);
  }

  return {
    insertedItems,
    batchesProcessed: batches.length
  };
}

module.exports = {
  batchWriteItems
};