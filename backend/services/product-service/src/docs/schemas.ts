import { OpenApiSchemaObject } from "@shared-swagger/openapi";

export const productLevelSchema: OpenApiSchemaObject = {
  type: "string",
  enum: ["N5", "N4", "N3", "N2", "N1", "JFT", "Beginner"]
};

export const sessionSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["id", "title", "type"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    type: {
      type: "string",
      enum: ["quiz", "pdf", "audio", "images", "video"]
    }
  }
};

export const topicSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["id", "title", "sessions"],
  properties: {
    id: { type: "string" },
    title: { type: "string" },
    sessions: {
      type: "array",
      items: sessionSchema
    }
  }
};

export const productSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["id", "name", "price", "shortDescription", "level", "topicsCount", "accessDurationDays"],
  properties: {
    id: { type: "string" },
    name: { type: "string" },
    price: { type: "number" },
    shortDescription: { type: "string" },
    level: productLevelSchema,
    topicsCount: { type: "number" },
    featuredProducts: { type: "boolean" },
    accessDurationDays: { type: "number" }
  }
};

export const productDetailSchema: OpenApiSchemaObject = {
  type: "object",
  required: [
    "id",
    "name",
    "price",
    "shortDescription",
    "level",
    "topicsCount",
    "accessDurationDays",
    "description",
    "topics"
  ],
  properties: {
    ...productSchema.properties,
    description: { type: "string" },
    topics: {
      type: "array",
      items: topicSchema
    }
  }
};

export const ownedProductSchema: OpenApiSchemaObject = {
  type: "object",
  required: ["id", "productId", "userId", "level", "name", "purchaseDate", "expiryDate"],
  properties: {
    id: { type: "string" },
    productId: { type: "string" },
    userId: { type: "string" },
    level: { type: "string" },
    name: { type: "string" },
    purchaseDate: { type: "string", format: "date-time" },
    expiryDate: { type: "string", format: "date-time" }
  }
};

export const sessionRecordSchema: OpenApiSchemaObject = {
  type: "object",
  required: [
    "PK",
    "SK",
    "entityType",
    "productId",
    "topicId",
    "sessionOrder",
    "id",
    "title",
    "type"
  ],
  properties: {
    PK: { type: "string" },
    SK: { type: "string" },
    entityType: { type: "string", enum: ["SESSION"] },
    productId: { type: "string" },
    topicId: { type: "string" },
    sessionOrder: { type: "number" },
    id: { type: "string" },
    title: { type: "string" },
    type: {
      type: "string",
      enum: ["practice", "pdf", "audio", "images", "video", "exam"]
    },
    contentUrl: { type: "string" },
    passingScore: { type: "number" },
    duration: { type: "number" }
  }
};
