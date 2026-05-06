import {
  CatalogProduct,
  CatalogSession,
  CatalogTopic,
  QuizAnswerKeyRecord,
  SubmitQuizAnswerRecord
} from "../models/quiz";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const isSubmitQuizAnswerRecord = (value: unknown): value is SubmitQuizAnswerRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return isNonEmptyString(record.questionId) && isNonEmptyString(record.selectedOptionId);
};

export const isQuizAnswerKeyRecord = (value: unknown): value is QuizAnswerKeyRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    isNonEmptyString(record.id) &&
    isNonEmptyString(record.correctAnswer) &&
    typeof record.score === "number" &&
    Number.isFinite(record.score) &&
    (record.explanation === undefined || typeof record.explanation === "string")
  );
};

const isCatalogSession = (value: unknown): value is CatalogSession => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const session = value as Record<string, unknown>;

  return (
    isNonEmptyString(session.id) &&
    (session.passingScore === undefined ||
      (typeof session.passingScore === "number" && Number.isFinite(session.passingScore)))
  );
};

const isCatalogTopic = (value: unknown): value is CatalogTopic => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const topic = value as Record<string, unknown>;

  return isNonEmptyString(topic.id) && Array.isArray(topic.sessions) && topic.sessions.every(isCatalogSession);
};

export const isCatalogProduct = (value: unknown): value is CatalogProduct => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Record<string, unknown>;

  return (
    isNonEmptyString(product.id) &&
    Array.isArray(product.topics) &&
    product.topics.every(isCatalogTopic) &&
    (product.passingScore === undefined ||
      (typeof product.passingScore === "number" && Number.isFinite(product.passingScore)))
  );
};
