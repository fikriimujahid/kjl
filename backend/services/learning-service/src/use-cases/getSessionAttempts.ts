import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import { listSessionAttempts } from "../repositories/sessionAttemptRepository";
import {
  getOwnedProductsByUserIdInternal,
  getSessionByIdInternal
} from "../services/productServiceInternalClient";
import {
  SessionAttemptHistoryResponse,
  SessionAttemptSessionType
} from "../types/learningTypes";
import { mapAttemptItem, orderAttemptsByRecent } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);

export interface GetSessionAttemptsInput {
  productId: string;
  topicId: string;
  sessionId: string;
  authenticatedUserId?: string | null;
}

export const getSessionAttempts = async (
  input: GetSessionAttemptsInput
): Promise<SessionAttemptHistoryResponse> => {
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

  const sessionType = session.type as SessionAttemptSessionType;

  const attempts = await listSessionAttempts({
    userId: input.authenticatedUserId,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  const orderedAttempts = orderAttemptsByRecent(attempts).map(mapAttemptItem);

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    sessionType,
    hasActiveAttempt: orderedAttempts.some((attempt) => attempt.isActive && attempt.status === "ACTIVE"),
    attempts: orderedAttempts
  };
};
