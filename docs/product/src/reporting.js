"use strict";

function printWarnings(warnings) {
  if (warnings.length === 0) {
    return;
  }

  console.log("\nWarnings");
  warnings.forEach((warning) => {
    console.log(`- ${warning}`);
  });
}

function printSummary({ summary, uploadCount, insertedItems, config }) {
  console.log("\nMigration summary");
  console.log(`- region: ${config.awsRegion}`);
  console.log(`- table: ${config.tableName}`);
  console.log(`- private bucket: ${config.privateBucketName}`);
  console.log(`- public bucket: ${config.publicBucketName}`);
  console.log(`- total products: ${summary.totalProducts}`);
  console.log(`- total topics: ${summary.totalTopics}`);
  console.log(`- total sessions: ${summary.totalSessions}`);
  console.log(`- total uploads: ${uploadCount}`);
  console.log(`- total inserted items: ${insertedItems}`);

  if (config.dryRun) {
    console.log("- mode: dry-run");
  }
}

module.exports = {
  printSummary,
  printWarnings
};