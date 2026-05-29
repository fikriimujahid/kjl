import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionAttemptAlreadyFinishedError,
  SessionAttemptNotFoundError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import {
  listSessionAttempts,
  saveSessionAttemptProgressInRepository
} from "../repositories/sessionAttemptRepository";
import {
  getOwnedProductsByUserIdInternal,
  getSessionByIdInternal
} from "../services/productServiceInternalClient";
import {
  SaveSessionAttemptProgressResponse,
  SessionAttemptProgressAnswer,
  SessionAttemptProgressCheckedAnswer,
  SessionAttemptSessionType
} from "../types/learningTypes";
import { mapAttemptItem } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);

export interface SaveSessionAttemptProgressInput {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  currentQuestionIndex: number;
  answeredQuestionIndexes: number[];
  answers: Record<string, SessionAttemptProgressAnswer>;
  checkedAnswers: Record<string, SessionAttemptProgressCheckedAnswer>;
  bookmarkedIndexes: number[];
  durationSeconds: number;
  authenticatedUserId?: string | null;
}

const normalizeIndexes = (indexes: number[]): number[] => {
  return Array.from(new Set(indexes.filter((index) => Number.isInteger(index) && index >= 0))).sort((a, b) => a - b);
};

export const saveSessionAttemptProgress = async (
  input: SaveSessionAttemptProgressInput
): Promise<SaveSessionAttemptProgressResponse> => {
  if (!input.authenticatedUserId) {
    throw new AuthenticationRequiredError();
  }

  const ownedProducts = await getOwnedProductsByUserIdInternal(input.authenticatedUserId);
  const hasAccess = ownedProducts.some((ownedProduct) => ownedProduct.productId === input.productId);

  if (!hasAccess) {
    throw new ForbiddenLearningContentAccessError();
  }

  const session = await getSessionByIdInternal(input.productId, input.topicId, input.sessionId);

  if (!session) {
    throw new SessionNotFoundError();
  }

  if (!SUPPORTED_ATTEMPT_SESSION_TYPES.has(session.type as SessionAttemptSessionType)) {
    throw new UnsupportedSessionTypeError(session.type);
  }

  const attempts = await listSessionAttempts({
    userId: input.authenticatedUserId,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  const targetAttempt = attempts.find((attempt) => attempt.attemptId === input.attemptId);

  if (!targetAttempt) {
    throw new SessionAttemptNotFoundError(input.attemptId);
  }

  if (targetAttempt.status === "FINISHED") {
    throw new SessionAttemptAlreadyFinishedError(input.attemptId);
  }

  const updatedAttempt = await saveSessionAttemptProgressInRepository({
    attempt: targetAttempt,
    currentQuestionIndex: Math.max(0, input.currentQuestionIndex),
    answeredQuestionIndexes: normalizeIndexes(input.answeredQuestionIndexes),
    answers: input.answers,
    checkedAnswers: input.checkedAnswers,
    bookmarkedIndexes: normalizeIndexes(input.bookmarkedIndexes),
    durationSeconds: Math.max(0, input.durationSeconds)
  });

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    attemptId: input.attemptId,
    savedAt: updatedAttempt.progressSavedAt ?? updatedAttempt.updatedAt,
    attempt: mapAttemptItem(updatedAttempt)
  };
};
