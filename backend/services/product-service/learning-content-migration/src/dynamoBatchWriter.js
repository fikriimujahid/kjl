"use strict";

const { BatchWriteCommand } = require("@aws-sdk/lib-dynamodb");

// DynamoDB BatchWriteItem accepts up to 25 items per request.
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
      Item: item,
    },
  }));

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const response = await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: pendingRequests,
        },
      })
    );

    // Retry only unprocessed requests, as recommended by DynamoDB docs.
    pendingRequests = response.UnprocessedItems?.[tableName] ?? [];

    if (pendingRequests.length === 0) {
      return;
    }

    if (attempt === maxRetries) {
      break;
    }

    const delayMs = getRetryDelayMs(attempt);
    await delay(delayMs);
  }

  throw new Error(
    `Failed to process ${pendingRequests.length} unprocessed items after ${maxRetries + 1} attempts.`
  );
}

async function batchWriteItems({ docClient, tableName, items, maxRetries = 5 }) {
  const batches = chunkArray(items, MAX_BATCH_SIZE);
  let insertedItems = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
    const batch = batches[batchIndex];

    try {
      await writeBatchWithRetry({
        docClient,
        tableName,
        items: batch,
        maxRetries,
      });

      insertedItems += batch.length;
      console.log(
        `Inserted batch ${batchIndex + 1}/${batches.length} (${batch.length} items).`
      );
    } catch (error) {
      throw new Error(
        `Batch ${batchIndex + 1}/${batches.length} failed. ${error.message}`
      );
    }
  }

  return {
    insertedItems,
    batchesProcessed: batches.length,
  };
}

module.exports = {
  batchWriteItems,
};
