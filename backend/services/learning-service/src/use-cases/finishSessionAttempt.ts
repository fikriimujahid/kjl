import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionAttemptNotFoundError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import { findSessionById } from "../repositories/findSessionById";
import {
  finishSessionAttemptInRepository,
  listSessionAttempts
} from "../repositories/sessionAttemptRepository";
import { getOwnedProductsByUserIdInternal } from "../services/productServiceInternalClient";
import {
  FinishSessionAttemptResponse,
  SessionAttemptSessionType
} from "../types/learningTypes";
import { mapAttemptItem, orderAttemptsByRecent } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);

export interface FinishSessionAttemptInput {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  totalQuestions: number;
  correctAnswers: number;
  maxScore: number;
  obtainedScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  durationSeconds?: number;
  authenticatedUserId?: string | null;
}

export const finishSessionAttempt = async (
  input: FinishSessionAttemptInput
): Promise<FinishSessionAttemptResponse> => {
  if (!input.authenticatedUserId) {
    throw new AuthenticationRequiredError();
  }

  const ownedProducts = await getOwnedProductsByUserIdInternal(input.authenticatedUserId);
  const hasAccess = ownedProducts.some((ownedProduct) => ownedProduct.productId === input.productId);

  if (!hasAccess) {
    throw new ForbiddenLearningContentAccessError();
  }

  const session = await findSessionById(input.productId, input.topicId, input.sessionId);

  if (!session) {
    throw new SessionNotFoundError();
  }

  if (!SUPPORTED_ATTEMPT_SESSION_TYPES.has(session.type as SessionAttemptSessionType)) {
    throw new UnsupportedSessionTypeError(session.type);
  }

  const sessionType = session.type as SessionAttemptSessionType;

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

  const updatedAttempt = targetAttempt.status === "FINISHED"
    ? targetAttempt
    : await finishSessionAttemptInRepository({
      attempt: targetAttempt,
      totalQuestions: input.totalQuestions,
      correctAnswers: input.correctAnswers,
      maxScore: input.maxScore,
      obtainedScore: input.obtainedScore,
      percentage: input.percentage,
      passingScore: input.passingScore,
      passed: input.passed,
      durationSeconds: input.durationSeconds
    });

  const updatedAttempts = attempts.map((attempt) =>
    attempt.attemptId === updatedAttempt.attemptId ? updatedAttempt : attempt
  );

  const attemptItems = orderAttemptsByRecent(updatedAttempts).map(mapAttemptItem);

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    sessionType,
    attempt: mapAttemptItem(updatedAttempt),
    hasActiveAttempt: attemptItems.some((attempt) => attempt.isActive && attempt.status === "ACTIVE"),
    attempts: attemptItems
  };
};
