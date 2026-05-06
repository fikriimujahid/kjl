import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { randomUUID } from "crypto";
import { SubmitQuizAnswerRecord } from "../models/quiz";
import { findSessionPassingScore } from "../repositories/productRepository";
import { saveQuizSubmission } from "../repositories/quizSubmissionRepository";
import { fetchQuizAnswerKey } from "../repositories/s3Repository";
import { calculateQuizScore } from "../services/quizScoringService";
import { getAuthenticatedUser } from "../utils/auth";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { isSubmitQuizAnswerRecord } from "../utils/validators";

const DYNAMO_DB_TABLE_NAME = process.env.DYNAMO_DB_TABLE_NAME;
const DEFAULT_PASSING_SCORE = 70;

const readRequiredString = (payload: Record<string, unknown>, fieldName: string): string => {
  const value = payload[fieldName];

  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Invalid ${fieldName}`);
  }

  return value.trim();
};

const readAnswerRecords = (payload: Record<string, unknown>): SubmitQuizAnswerRecord[] => {
  const answers = payload.answers;

  if (!Array.isArray(answers)) {
    throw new Error("Invalid answers");
  }

  const normalizedAnswers = answers.filter(isSubmitQuizAnswerRecord).map((item) => ({
    questionId: item.questionId.trim(),
    selectedOptionId: item.selectedOptionId.trim()
  }));

  if (normalizedAnswers.length === 0) {
    throw new Error("Answers cannot be empty");
  }

  return normalizedAnswers;
};

export const submitQuizExam = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (!DYNAMO_DB_TABLE_NAME) {
    return jsonResponse(500, { message: "Missing DYNAMO_DB_TABLE_NAME environment variable" });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  if (!authenticatedUser) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(400, { message: "Invalid JSON body" });
  }

  let productId: string;
  let topicId: string;
  let sessionId: string;
  let answers: SubmitQuizAnswerRecord[];

  try {
    productId = readRequiredString(payload, "productId");
    topicId = readRequiredString(payload, "topicId");
    sessionId = readRequiredString(payload, "sessionId");
    answers = readAnswerRecords(payload);
  } catch (error) {
    return jsonResponse(400, {
      message: error instanceof Error ? error.message : "Invalid request payload"
    });
  }

  let answerKey;

  try {
    answerKey = await fetchQuizAnswerKey(productId, topicId, sessionId);
  } catch {
    return jsonResponse(502, { message: "Failed to load answer key" });
  }

  if (answerKey.length === 0) {
    return jsonResponse(404, { message: "Quiz answer key not found" });
  }

  let passingScoreResult;

  try {
    passingScoreResult = await findSessionPassingScore(
      productId,
      topicId,
      sessionId,
      DEFAULT_PASSING_SCORE
    );
  } catch {
    return jsonResponse(502, { message: "Failed to load product data" });
  }

  if (!passingScoreResult.productFound || !passingScoreResult.sessionFound) {
    return jsonResponse(404, { message: "Quiz session not found in product catalog" });
  }

  const scoreSummary = calculateQuizScore(answerKey, answers);
  const passed = scoreSummary.percentage >= passingScoreResult.passingScore;
  const submissionId = randomUUID();
  const submittedAt = new Date().toISOString();

  try {
    await saveQuizSubmission({
      tableName: DYNAMO_DB_TABLE_NAME,
      submissionId,
      userId: authenticatedUser.id,
      userEmail: authenticatedUser.email,
      productId,
      topicId,
      sessionId,
      submittedAt,
      scoreSummary,
      passingScore: passingScoreResult.passingScore,
      passed,
      answers
    });
  } catch {
    return jsonResponse(502, { message: "Failed to persist quiz submission" });
  }

  return jsonResponse(200, {
    submissionId,
    submittedAt,
    productId,
    topicId,
    sessionId,
    passingScore: passingScoreResult.passingScore,
    passed,
    obtainedScore: scoreSummary.obtainedScore,
    maxScore: scoreSummary.maxScore,
    percentage: scoreSummary.percentage,
    answeredCount: scoreSummary.answeredCount,
    totalQuestions: scoreSummary.totalQuestions,
    details: scoreSummary.details
  });
};
