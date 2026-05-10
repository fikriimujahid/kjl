"use strict";

function isObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateSession(session, pathPrefix, errors) {
  if (!isObject(session)) {
    errors.push(`${pathPrefix} must be an object.`);
    return;
  }

  if (typeof session.id !== "string" || !session.id.trim()) {
    errors.push(`${pathPrefix}.id is required and must be a non-empty string.`);
  }

  if (typeof session.title !== "string" || !session.title.trim()) {
    errors.push(`${pathPrefix}.title is required and must be a non-empty string.`);
  }

  if (typeof session.type !== "string" || !session.type.trim()) {
    errors.push(`${pathPrefix}.type is required and must be a non-empty string.`);
  }
}

function validateTopic(topic, pathPrefix, errors) {
  if (!isObject(topic)) {
    errors.push(`${pathPrefix} must be an object.`);
    return;
  }

  if (typeof topic.id !== "string" || !topic.id.trim()) {
    errors.push(`${pathPrefix}.id is required and must be a non-empty string.`);
  }

  if (typeof topic.title !== "string" || !topic.title.trim()) {
    errors.push(`${pathPrefix}.title is required and must be a non-empty string.`);
  }

  if (!Array.isArray(topic.sessions)) {
    errors.push(`${pathPrefix}.sessions is required and must be an array.`);
    return;
  }

  topic.sessions.forEach((session, sessionIndex) => {
    validateSession(session, `${pathPrefix}.sessions[${sessionIndex}]`, errors);
  });
}

function validateProduct(product, pathPrefix, errors) {
  if (!isObject(product)) {
    errors.push(`${pathPrefix} must be an object.`);
    return;
  }

  if (typeof product.id !== "string" || !product.id.trim()) {
    errors.push(`${pathPrefix}.id is required and must be a non-empty string.`);
  }

  if (typeof product.name !== "string" || !product.name.trim()) {
    errors.push(`${pathPrefix}.name is required and must be a non-empty string.`);
  }

  if (!Array.isArray(product.topics)) {
    errors.push(`${pathPrefix}.topics is required and must be an array.`);
    return;
  }

  product.topics.forEach((topic, topicIndex) => {
    validateTopic(topic, `${pathPrefix}.topics[${topicIndex}]`, errors);
  });
}

function validateProductsJson(payload) {
  const errors = [];

  if (!Array.isArray(payload)) {
    throw new Error("Input JSON must be an array of products.");
  }

  if (payload.length === 0) {
    throw new Error("Input JSON contains no products.");
  }

  payload.forEach((product, productIndex) => {
    validateProduct(product, `products[${productIndex}]`, errors);
  });

  if (errors.length > 0) {
    throw new Error(`JSON validation failed:\n- ${errors.join("\n- ")}`);
  }
}

module.exports = {
  validateProductsJson,
};
