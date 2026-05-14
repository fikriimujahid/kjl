const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const docsModulePath = path.resolve(
  rootDir,
  "services",
  "auth-service",
  "build",
  "lambda",
  "services",
  "auth-service",
  "src",
  "docs",
  "index.js"
);
const outputPath = path.resolve(
  rootDir,
  "services",
  "auth-service",
  "openapi",
  "swagger.json"
);

if (!fs.existsSync(docsModulePath)) {
  console.error("Auth-service build output not found.");
  console.error("Run: npm run build --workspace auth-service");
  process.exit(1);
}

const { generateAuthServiceOpenApiJson } = require(docsModulePath);
const openApiJson = generateAuthServiceOpenApiJson();

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, openApiJson, "utf8");

console.log(`Generated: ${path.relative(rootDir, outputPath)}`);
