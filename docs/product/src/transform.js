"use strict";

function buildTopicPartitionKey(productId, topicId) {
  return `TOPIC#${productId}#${topicId}`;
}

function transformProductsToItems(products) {
  const items = [];
  const summary = {
    totalProducts: 0,
    totalTopics: 0,
    totalSessions: 0
  };

  products.forEach((product, productIndex) => {
    const { topics = [], ...productAttributes } = product;
    const productPartitionKey = `PRODUCT#${product.id}`;

    items.push({
      PK: productPartitionKey,
      SK: "METADATA",
      entityType: "PRODUCT",
      ...productAttributes
    });

    summary.totalProducts += 1;

    topics.forEach((topic, topicIndex) => {
      const { sessions = [], ...topicAttributes } = topic;
      const topicPartitionKey = buildTopicPartitionKey(product.id, topic.id);

      items.push({
        PK: productPartitionKey,
        SK: `TOPIC#${topic.id}`,
        entityType: "TOPIC",
        productId: product.id,
        topicPartitionKey,
        topicOrder: topicIndex,
        ...topicAttributes
      });

      summary.totalTopics += 1;

      sessions.forEach((session, sessionIndex) => {
        items.push({
          PK: productPartitionKey,
          SK: `SESSION#${topic.id}#${session.id}`,
          entityType: "SESSION",
          productId: product.id,
          topicId: topic.id,
          productOrder: productIndex,
          topicOrder: topicIndex,
          sessionOrder: sessionIndex,
          ...session
        });

        summary.totalSessions += 1;
      });
    });
  });

  return { items, summary };
}

module.exports = {
  transformProductsToItems
};