const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const outputPath = path.resolve(rootDir, "openapi", "swagger.json");

const serviceSpecs = [
  {
    serviceName: "auth-service",
    docsModulePath: path.resolve(
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
    ),
    buildOpenApiExport: "buildAuthServiceOpenApi"
  },
  {
    serviceName: "product-service",
    docsModulePath: path.resolve(
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
    ),
    buildOpenApiExport: "buildProductServiceOpenApi"
  },
  {
    serviceName: "payment-service",
    docsModulePath: path.resolve(
      rootDir,
      "services",
      "payment-service",
      "build",
      "lambda",
      "services",
      "payment-service",
      "src",
      "docs",
      "index.js"
    ),
    buildOpenApiExport: "buildPaymentServiceOpenApi"
  }
];

const readServiceDocument = ({ serviceName, docsModulePath, buildOpenApiExport }) => {
  if (!fs.existsSync(docsModulePath)) {
    console.error(`${serviceName} build output not found.`);
    console.error(`Build the service before generating the combined swagger.`);
    process.exit(1);
  }

  const docsModule = require(docsModulePath);
  const buildOpenApi = docsModule[buildOpenApiExport];

  if (typeof buildOpenApi !== "function") {
    console.error(`Missing export \`${buildOpenApiExport}\` in ${serviceName} docs module.`);
    process.exit(1);
  }

  return buildOpenApi();
};

const mergeRecordWithConflictCheck = (target, source, sectionName) => {
  for (const [key, value] of Object.entries(source || {})) {
    if (!(key in target)) {
      target[key] = value;
      continue;
    }

    if (JSON.stringify(target[key]) !== JSON.stringify(value)) {
      console.error(`Conflicting ${sectionName} entry detected for \`${key}\`.`);
      process.exit(1);
    }
  }
};

const mergeTags = (documents) => {
  const tagsByName = new Map();

  for (const document of documents) {
    for (const tag of document.tags || []) {
      const existingTag = tagsByName.get(tag.name);

      if (!existingTag) {
        tagsByName.set(tag.name, tag);
        continue;
      }

      if (JSON.stringify(existingTag) !== JSON.stringify(tag)) {
        console.error(`Conflicting tag definition detected for \`${tag.name}\`.`);
        process.exit(1);
      }
    }
  }

  return Array.from(tagsByName.values());
};

const mergeServers = (documents) => {
  const uniqueServers = [];
  const seenServers = new Set();

  for (const document of documents) {
    for (const server of document.servers || []) {
      const serverKey = JSON.stringify(server);

      if (seenServers.has(serverKey)) {
        continue;
      }

      seenServers.add(serverKey);
      uniqueServers.push(server);
    }
  }

  return uniqueServers;
};

const applyPathLevelServers = (document) => {
  const documentServers = Array.isArray(document.servers) ? document.servers : [];

  if (documentServers.length === 0) {
    return document.paths || {};
  }

  return Object.fromEntries(
    Object.entries(document.paths || {}).map(([pathKey, pathItem]) => [
      pathKey,
      pathItem.servers ? pathItem : { ...pathItem, servers: documentServers }
    ])
  );
};

const documents = serviceSpecs.map(readServiceDocument);
const mergedPaths = {};
const mergedComponents = {};

for (const document of documents) {
  mergeRecordWithConflictCheck(mergedPaths, applyPathLevelServers(document), "path");
  mergeRecordWithConflictCheck(
    mergedComponents,
    document.components,
    "component section"
  );
}

const mergedDocument = {
  openapi: "3.0.3",
  info: {
    title: "KeJepangDulu API",
    version: documents[0]?.info?.version || "1.0.0",
    description: "Combined OpenAPI document for all backend services with published endpoint docs."
  },
  paths: mergedPaths
};

const mergedTags = mergeTags(documents);
const mergedServers = mergeServers(documents);

if (Object.keys(mergedComponents).length > 0) {
  mergedDocument.components = mergedComponents;
}

if (mergedServers.length > 0) {
  mergedDocument.servers = mergedServers;
}

if (mergedTags.length > 0) {
  mergedDocument.tags = mergedTags;
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(mergedDocument, null, 2), "utf8");

console.log(`Generated: ${path.relative(rootDir, outputPath)}`);
console.log(
  `Included services: ${serviceSpecs.map((service) => service.serviceName).join(", ")}`
);