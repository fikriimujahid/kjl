import { Product } from "../models/product";
import { PurchaseRecord, QuizOptionRecord, QuizQuestionRecord } from "../types/productServiceTypes";

export const isProduct = (value: unknown): value is Product => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "number" &&
    typeof candidate.description === "string"
  );
};

export const isPurchaseRecord = (value: unknown): value is PurchaseRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.PK === "string" &&
    typeof candidate.SK === "string" &&
    candidate.entityType === "PURCHASE" &&
    typeof candidate.userId === "string" &&
    typeof candidate.productId === "string" &&
    typeof candidate.purchaseDate === "string" &&
    typeof candidate.expiryDate === "string"
  );
};

export const isQuizOptionRecord = (value: unknown): value is QuizOptionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.text === "string";
};

export const isQuizQuestionRecord = (value: unknown): value is QuizQuestionRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.text === "string" &&
    Array.isArray(candidate.options) &&
    candidate.options.every(isQuizOptionRecord) &&
    (candidate.image === undefined || typeof candidate.image === "string") &&
    (candidate.audio === undefined || typeof candidate.audio === "string")
  );
};
