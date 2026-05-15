const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const docsModulePath = path.resolve(
  rootDir,
  "services",
  "product-service",
  "build",
  "lambda",
  "services",
  "product-service",
  "src",
  "docs",
  "index.js"
);
const outputPath = path.resolve(
  rootDir,
  "services",
  "product-service",
  "openapi",
  "swagger.json"
);

if (!fs.existsSync(docsModulePath)) {
  console.error("Product-service build output not found.");
  console.error("Run: npm run build --workspace product-service");
  process.exit(1);
}

const { generateProductServiceOpenApiJson } = require(docsModulePath);
const openApiJson = generateProductServiceOpenApiJson();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, openApiJson, "utf8");

console.log(`Generated: ${path.relative(rootDir, outputPath)}`);
