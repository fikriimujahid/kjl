"use strict";

const fs = require("node:fs/promises");
const path = require("node:path");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const { pathExists } = require("./products");

const IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png|webp|gif)$/i;

async function listFiles(rootDirectory) {
  const entries = await fs.readdir(rootDirectory, { withFileTypes: true });
  return entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
}

function buildPrivateSessionPrefix(productId, topicId, sessionId) {
  return `learning-content/${productId}/${topicId}/${sessionId}`;
}

function buildPublicSessionPrefix(productId, topicId, sessionId) {
  return `public-data/${productId}/${topicId}/${sessionId}`;
}

function resolveContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".json":
      return "application/json";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".mp3":
      return "audio/mpeg";
    default:
      return "application/octet-stream";
  }
}

function buildUploadDescriptor(filePath, bucketName, key) {
  return {
    filePath,
    bucketName,
    key,
    contentType: resolveContentType(filePath)
  };
}

function getPracticeOrExamContentFiles(fileNames) {
  return fileNames.filter(
    (fileName) => fileName !== "answer.json" && fileName !== "question.json"
  );
}

async function collectSessionUploads({
  product,
  productDirectory,
  privateBucketName,
  publicBucketName
}) {
  const uploads = [];

  for (const topic of product.topics) {
    for (const session of topic.sessions) {
      const sessionDirectory = path.join(productDirectory, topic.id, session.id);
      const privatePrefix = buildPrivateSessionPrefix(product.id, topic.id, session.id);

      if (!(await pathExists(sessionDirectory))) {
        throw new Error(`Missing session directory: ${sessionDirectory}`);
      }

      if (session.type === "images") {
        const fileNames = await listFiles(sessionDirectory);
        const imageNames = fileNames.filter((fileName) => IMAGE_FILE_PATTERN.test(fileName));

        if (imageNames.length === 0) {
          throw new Error(`No image files found for images session at ${sessionDirectory}`);
        }

        imageNames.sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: "base" }));

        imageNames.forEach((fileName) => {
          uploads.push(
            buildUploadDescriptor(
              path.join(sessionDirectory, fileName),
              privateBucketName,
              `${privatePrefix}/${fileName}`
            )
          );
        });
        continue;
      }

      if (session.type === "practice" || session.type === "exam") {
        const questionFilePath = path.join(sessionDirectory, "question.json");
        const answerFilePath = path.join(sessionDirectory, "answer.json");

        if (!(await pathExists(questionFilePath))) {
          throw new Error(`Missing question.json for ${product.id}/${topic.id}/${session.id}`);
        }

        if (!(await pathExists(answerFilePath))) {
          throw new Error(`Missing answer.json for ${product.id}/${topic.id}/${session.id}`);
        }

        uploads.push(buildUploadDescriptor(questionFilePath, privateBucketName, `${privatePrefix}/question.json`));
        uploads.push(buildUploadDescriptor(answerFilePath, privateBucketName, `${privatePrefix}/answer.json`));

        const sessionFiles = await listFiles(sessionDirectory);
        const publicContentFiles = getPracticeOrExamContentFiles(sessionFiles);
        const publicPrefix = buildPublicSessionPrefix(product.id, topic.id, session.id);

        publicContentFiles.forEach((fileName) => {
          uploads.push(
            buildUploadDescriptor(
              path.join(sessionDirectory, fileName),
              publicBucketName,
              `${publicPrefix}/${fileName}`
            )
          );
        });
      }
    }
  }

  return { uploads };
}

async function collectUploads(productEntries, config) {
  const readyEntries = [];
  const uploads = [];
  const warnings = [];

  for (const entry of productEntries) {
    try {
      const result = await collectSessionUploads({
        product: entry.product,
        productDirectory: entry.productDirectory,
        privateBucketName: config.privateBucketName,
        publicBucketName: config.publicBucketName
      });

      readyEntries.push(entry);
      uploads.push(...result.uploads);
    } catch (error) {
      if (config.requestedProductIds.size > 0) {
        throw error;
      }

      warnings.push(`Skipping product ${entry.product.id}: ${error.message}`);
    }
  }

  if (readyEntries.length === 0) {
    throw new Error("No complete products were found to migrate.");
  }

  return { readyEntries, uploads, warnings };
}

async function uploadFile(s3Client, upload) {
  const body = await fs.readFile(upload.filePath);

  await s3Client.send(
    new PutObjectCommand({
      Bucket: upload.bucketName,
      Key: upload.key,
      Body: body,
      ContentType: upload.contentType
    })
  );
}

async function uploadFiles({ s3Client, uploads, dryRun }) {
  for (let index = 0; index < uploads.length; index += 1) {
    const upload = uploads[index];

    if (dryRun) {
      console.log(`[dry-run] upload ${index + 1}/${uploads.length}: ${upload.key}`);
      continue;
    }

    await uploadFile(s3Client, upload);
    console.log(`Uploaded ${index + 1}/${uploads.length}: ${upload.key}`);
  }
}

module.exports = {
  collectUploads,
  uploadFiles
};