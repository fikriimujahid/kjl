const fs = require("fs");
const path = require("path");

const buildDir = path.resolve(__dirname, "..", "build", "lambda");
const lambdaDir = path.resolve(__dirname, "..", "lambda");

if (!fs.existsSync(buildDir)) {
  throw new Error(`Build directory not found: ${buildDir}`);
}

fs.rmSync(lambdaDir, { recursive: true, force: true });
fs.mkdirSync(lambdaDir, { recursive: true });
fs.cpSync(buildDir, lambdaDir, { recursive: true });
