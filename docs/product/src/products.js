"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");

const { validateProducts } = require("./validate");

async function readJson(filePath) {
  let rawValue;

  try {
    rawValue = await fs.readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`Failed to read JSON file at ${filePath}: ${error.message}`);
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    throw new Error(`Invalid JSON at ${filePath}: ${error.message}`);
  }
}

function extractProducts(payload, filePath) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && Array.isArray(payload.products)) {
    return payload.products;
  }

  throw new Error(`Input JSON at ${filePath} must be an array or an object with a products array.`);
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function listDirectories(rootDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function resolveProductDirectories(config) {
  const directoryNames = await listDirectories(config.contentRoot);
  const productDirectories = [];

  for (const directoryName of directoryNames) {
    if (config.requestedProductIds.size > 0 && !config.requestedProductIds.has(directoryName)) {
      continue;
    }

    const productDirectory = path.join(config.contentRoot, directoryName);
    const productFilePath = path.join(productDirectory, "product.json");

    if (!(await pathExists(productFilePath))) {
      continue;
    }

    productDirectories.push({
      directoryName,
      productDirectory,
      productFilePath
    });
  }

  if (productDirectories.length === 0) {
    throw new Error("No product directories with product.json were found under docs/product.");
  }

  return productDirectories.sort((left, right) => left.directoryName.localeCompare(right.directoryName));
}

async function loadProducts(config) {
  const productDirectories = await resolveProductDirectories(config);
  const products = [];

  for (const entry of productDirectories) {
    const payload = await readJson(entry.productFilePath);
    const extractedProducts = extractProducts(payload, entry.productFilePath);
    validateProducts(extractedProducts, entry.productFilePath);

    if (extractedProducts.length !== 1) {
      throw new Error(
        `Expected exactly one product in ${entry.productFilePath} so local asset paths stay aligned with docs/product/{productId}.`
      );
    }

    const [product] = extractedProducts;

    if (product.id !== entry.directoryName) {
      throw new Error(
        `Product id ${product.id} in ${entry.productFilePath} must match folder name ${entry.directoryName}.`
      );
    }

    products.push({
      product,
      productDirectory: entry.productDirectory,
      productFilePath: entry.productFilePath
    });
  }

  return products;
}

module.exports = {
  loadProducts,
  pathExists
};