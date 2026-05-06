import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { QuizScoreSummary, SubmitQuizAnswerRecord } from "../models/quiz";
import { dynamoDbDocumentClient } from "../clients/awsClients";

interface SaveQuizSubmissionInput {
  tableName: string;
  submissionId: string;
  userId: string;
  userEmail: string;
  productId: string;
  topicId: string;
  sessionId: string;
  submittedAt: string;
  scoreSummary: QuizScoreSummary;
  passingScore: number;
  passed: boolean;
  answers: SubmitQuizAnswerRecord[];
}

export const saveQuizSubmission = async (
  input: SaveQuizSubmissionInput
): Promise<void> => {
  const userHistoryItem = {
    PK: `USER#${input.userId}`,
    SK: `QUIZ_SUBMISSION#${input.productId}#${input.topicId}#${input.sessionId}#${input.submittedAt}#${input.submissionId}`,
    entityType: "QUIZ_SUBMISSION",
    submissionId: input.submissionId,
    userId: input.userId,
    userEmail: input.userEmail,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    submittedAt: input.submittedAt,
    passingScore: input.passingScore,
    passed: input.passed,
    obtainedScore: input.scoreSummary.obtainedScore,
    maxScore: input.scoreSummary.maxScore,
    percentage: input.scoreSummary.percentage,
    answeredCount: input.scoreSummary.answeredCount,
    totalQuestions: input.scoreSummary.totalQuestions,
    answers: input.answers,
    details: input.scoreSummary.details
  };

  const quizAnalyticsItem = {
    PK: `QUIZ#${input.productId}#${input.topicId}#${input.sessionId}`,
    SK: `SUBMISSION#${input.submittedAt}#${input.submissionId}`,
    entityType: "QUIZ_ANALYTICS",
    submissionId: input.submissionId,
    userId: input.userId,
    submittedAt: input.submittedAt,
    passingScore: input.passingScore,
    passed: input.passed,
    obtainedScore: input.scoreSummary.obtainedScore,
    maxScore: input.scoreSummary.maxScore,
    percentage: input.scoreSummary.percentage,
    answeredCount: input.scoreSummary.answeredCount,
    totalQuestions: input.scoreSummary.totalQuestions
  };

  await Promise.all([
    dynamoDbDocumentClient.send(
      new PutCommand({
        TableName: input.tableName,
        Item: userHistoryItem
      })
    ),
    dynamoDbDocumentClient.send(
      new PutCommand({
        TableName: input.tableName,
        Item: quizAnalyticsItem
      })
    )
  ]);
};
