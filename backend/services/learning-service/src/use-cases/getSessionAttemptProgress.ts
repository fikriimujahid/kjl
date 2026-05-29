import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionAttemptNotFoundError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import { listSessionAttempts } from "../repositories/sessionAttemptRepository";
import {
  getOwnedProductsByUserIdInternal,
  getSessionByIdInternal
} from "../services/productServiceInternalClient";
import {
  GetSessionAttemptProgressResponse,
  SessionAttemptSessionType
} from "../types/learningTypes";
import { mapAttemptItem } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);

export interface GetSessionAttemptProgressInput {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  authenticatedUserId?: string | null;
}

export const getSessionAttemptProgress = async (
  input: GetSessionAttemptProgressInput
): Promise<GetSessionAttemptProgressResponse> => {
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

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    attemptId: input.attemptId,
    savedAt: targetAttempt.progressSavedAt ?? targetAttempt.updatedAt,
    attempt: mapAttemptItem(targetAttempt)
  };
};
