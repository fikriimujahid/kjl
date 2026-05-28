"use strict";

function parseBoolean(value) {
  if (typeof value !== "string") {
    return false;
  }

  return ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
}

function parseMaxRetries() {
  const rawValue = process.env.MAX_RETRIES;

  if (!rawValue) {
    return 5;
  }

  const parsedValue = Number.parseInt(rawValue, 10);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error("MAX_RETRIES must be a non-negative integer.");
  }

  return parsedValue;
}

function getConfig() {
  const requestedProductIds = (process.env.PRODUCT_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return {
    awsRegion: process.env.AWS_REGION || "ap-southeast-1",
    tableName: process.env.DYNAMODB_TABLE_NAME || "kjl-progress-dev",
    privateBucketName: process.env.MEDIA_PRIVATE_BUCKET_NAME || "kejepangdulu-dev-media-private",
    publicBucketName: process.env.MEDIA_PUBLIC_BUCKET_NAME || "kejepangdulu-dev-public",
    contentRoot: process.cwd(),
    maxRetries: parseMaxRetries(),
    dryRun: parseBoolean(process.env.DRY_RUN),
    requestedProductIds: new Set(requestedProductIds)
  };
}

module.exports = {
  getConfig
};