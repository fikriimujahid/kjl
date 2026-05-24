import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionAnswerNotFoundError,
  SessionNotFoundError,
  UnsupportedSessionTypeError
} from "../errors/applicationErrors";
import { findSessionById } from "../repositories/findSessionById";
import { getOwnedProductsByUserIdInternal } from "../services/productServiceInternalClient";
import { getSessionAnswersFromStorage } from "../services/sessionAnswerStorage";
import { SessionSingleAnswerCheckResult } from "../types/learningTypes";

const SUPPORTED_SESSION_TYPE = "practice";

export interface CheckSessionAnswerInput {
  productId: string;
  topicId: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: string;
  authenticatedUserId?: string | null;
}

export const checkSessionAnswer = async (
  input: CheckSessionAnswerInput
): Promise<SessionSingleAnswerCheckResult> => {
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

  if (session.type !== SUPPORTED_SESSION_TYPE) {
    throw new UnsupportedSessionTypeError(session.type);
  }

  const answerKeys = await getSessionAnswersFromStorage({
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  const answerKey = answerKeys.find((item) => item.id === input.questionId);

  if (!answerKey) {
    throw new SessionAnswerNotFoundError(input.questionId);
  }

  const isCorrect = answerKey.correctAnswer === input.selectedOptionId;
  const awardedScore = isCorrect ? answerKey.score : 0;

  return {
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    questionId: input.questionId,
    selectedOptionId: input.selectedOptionId,
    correctAnswer: answerKey.correctAnswer,
    isCorrect,
    score: answerKey.score,
    awardedScore,
    explanation: answerKey.explanation
  };
};
