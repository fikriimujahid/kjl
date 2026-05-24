import {
  AuthenticationRequiredError,
  ForbiddenLearningContentAccessError,
  SessionAnswerNotFoundError,
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
import { getSessionAnswersFromStorage } from "../services/sessionAnswerStorage";
import {
  FinishSessionAttemptResponse,
  SessionAttemptEvaluation,
  SessionAttemptFinishAnswerInput,
  SessionAttemptSessionType
} from "../types/learningTypes";
import { mapAttemptItem, orderAttemptsByRecent } from "./sessionAttemptMappers";

const SUPPORTED_ATTEMPT_SESSION_TYPES = new Set<SessionAttemptSessionType>(["practice", "exam"]);
const PASSING_SCORE = 70;

export interface FinishSessionAttemptInput {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  answers: SessionAttemptFinishAnswerInput[];
  durationSeconds?: number;
  authenticatedUserId?: string | null;
}

const buildEvaluation = (
  answers: SessionAttemptFinishAnswerInput[],
  answerKeys: Array<{ id: string; correctAnswer: string; score: number; explanation?: string }>
): SessionAttemptEvaluation => {
  const selectedOptionByQuestionId = new Map(
    answers.map((answer) => [answer.questionId, answer.selectedOptionId])
  );
  const knownQuestionIds = new Set(answerKeys.map((answerKey) => answerKey.id));

  for (const answer of answers) {
    if (!knownQuestionIds.has(answer.questionId)) {
      throw new SessionAnswerNotFoundError(answer.questionId);
    }
  }

  const details = answerKeys.map((answerKey) => {
    const selectedOptionId = selectedOptionByQuestionId.get(answerKey.id) ?? "";
    const isCorrect = selectedOptionId.length > 0 && answerKey.correctAnswer === selectedOptionId;
    const awardedScore = isCorrect ? answerKey.score : 0;

    return {
      questionId: answerKey.id,
      selectedOptionId,
      correctAnswer: answerKey.correctAnswer,
      isCorrect,
      score: answerKey.score,
      awardedScore,
      explanation: answerKey.explanation
    };
  });

  const totalQuestions = details.length;
  const correctAnswers = details.filter((detail) => detail.isCorrect).length;
  const wrongAnswers = Math.max(totalQuestions - correctAnswers, 0);
  const maxScore = details.reduce((total, detail) => total + detail.score, 0);
  const obtainedScore = details.reduce((total, detail) => total + detail.awardedScore, 0);
  const percentage = maxScore === 0 ? 0 : Math.round((obtainedScore / maxScore) * 100);
  const passed = percentage >= PASSING_SCORE;

  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    maxScore,
    obtainedScore,
    percentage,
    passingScore: PASSING_SCORE,
    passed,
    details
  };
};

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

  const answerKeys = await getSessionAnswersFromStorage({
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId
  });

  const evaluation = buildEvaluation(input.answers, answerKeys);

  const updatedAttempt = targetAttempt.status === "FINISHED"
    ? targetAttempt
    : await finishSessionAttemptInRepository({
      attempt: targetAttempt,
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      wrongAnswers: evaluation.wrongAnswers,
      maxScore: evaluation.maxScore,
      obtainedScore: evaluation.obtainedScore,
      percentage: evaluation.percentage,
      passingScore: evaluation.passingScore,
      passed: evaluation.passed,
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
    evaluation,
    hasActiveAttempt: attemptItems.some((attempt) => attempt.isActive && attempt.status === "ACTIVE"),
    attempts: attemptItems
  };
};
