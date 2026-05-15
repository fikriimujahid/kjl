"use strict";

const path = require("node:path");

const DEFAULT_INPUT_FILE = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  "frontend",
  "web",
  "public",
  "public-data",
  "product.json"
);

function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

function parseMaxRetries() {
  const value = process.env.MAX_RETRIES;

  if (!value) {
    return 5;
  }

  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed < 0) {
    throw new Error("MAX_RETRIES must be a non-negative integer.");
  }

  return parsed;
}

function getConfig() {
  const inputFileArg = process.argv[2];
  const inputFileEnv = process.env.INPUT_FILE;
  const inputFile = inputFileArg
    ? path.resolve(process.cwd(), inputFileArg)
    : inputFileEnv
      ? path.resolve(process.cwd(), inputFileEnv)
      : DEFAULT_INPUT_FILE;

  return {
    awsRegion: getRequiredEnv("AWS_REGION"),
    tableName: getRequiredEnv("DYNAMODB_TABLE_NAME"),
    inputFile,
    maxRetries: parseMaxRetries(),
  };
}

module.exports = {
  getConfig,
};
