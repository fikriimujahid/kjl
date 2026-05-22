import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import { findSessionById } from "../repositories/findSessionById";
import { createSessionAttempt, listSessionAttempts } from "../repositories/sessionAttemptRepository";
import { getOwnedProductsByUserIdInternal } from "../services/productServiceInternalClient";
import {
  SessionAttemptSessionType,
  StartSessionAttemptResponse
} from "../types/learningTypes";
import { mapAttemptItem, orderAttemptsByRecent } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);

export interface StartSessionAttemptInput {
  productId: string;
  topicId: string;
  sessionId: string;
  authenticatedUserId?: string | null;
}

export const startSessionAttempt = async (
  input: StartSessionAttemptInput
): Promise<StartSessionAttemptResponse> => {
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

  const activeAttempt = attempts.find((attempt) => attempt.isActive && attempt.status === "ACTIVE");

  if (activeAttempt) {
    const orderedAttempts = orderAttemptsByRecent(attempts).map(mapAttemptItem);

    return {
      productId: input.productId,
      topicId: input.topicId,
      sessionId: input.sessionId,
      sessionType,
      resumed: true,
      attempt: mapAttemptItem(activeAttempt),
      attempts: orderedAttempts,
      hasActiveAttempt: true
    };
  }

  const nowIso = new Date().toISOString();
  const createdAttempt = await createSessionAttempt({
    userId: input.authenticatedUserId,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    sessionType,
    attemptNumber: attempts.length + 1,
    startedAt: nowIso
  });

  const attemptItems = orderAttemptsByRecent([...attempts, createdAttempt]).map(mapAttemptItem);

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    sessionType,
    resumed: false,
    attempt: mapAttemptItem(createdAttempt),
    attempts: attemptItems,
    hasActiveAttempt: true
  };
};
