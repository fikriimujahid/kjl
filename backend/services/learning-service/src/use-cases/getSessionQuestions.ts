import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import {
  getOwnedProductsByUserIdInternal,
  getSessionByIdInternal
} from "../services/productServiceInternalClient";
import { getSessionQuestionsFromStorage } from "../services/sessionQuestionStorage";
import { SessionQuestionContent } from "../types/learningTypes";

const SUPPORTED_QUESTION_SESSION_TYPES = new Set(["practice", "exam", "quiz"]);

export interface GetSessionQuestionsInput {
  productId: string;
  topicId: string;
  sessionId: string;
  authenticatedUserId?: string | null;
}

export const getSessionQuestions = async (
  input: GetSessionQuestionsInput
): Promise<SessionQuestionContent> => {
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

  if (!SUPPORTED_QUESTION_SESSION_TYPES.has(session.type)) {
    throw new UnsupportedSessionTypeError(session.type);
  }

  const questions = await getSessionQuestionsFromStorage({
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    questions
  };
};
