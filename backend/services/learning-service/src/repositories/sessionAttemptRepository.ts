import { createItem } from "@shared-dynamodb/createItem";
import { selectItems } from "@shared-dynamodb/selectItems";
import { updateItem } from "@shared-dynamodb/updateItem";
import { createDynamoDocumentClient } from "@shared-dynamodb/client";
import { createLogger } from "@shared-utils/logger";
import { randomUUID } from "crypto";
import { getLearningServiceEnv } from "../config/env";
import {
  SessionAttemptProgressAnswer,
  SessionAttemptProgressCheckedAnswer,
  SessionAttemptRecord,
  SessionAttemptSessionType
} from "../types/learningTypes";

const logger = createLogger("learning-service");

const USER_PARTITION_KEY_PREFIX = "USER#";
const SESSION_ATTEMPT_SORT_KEY_PREFIX = "LEARNING_ATTEMPT#";

interface ListSessionAttemptsInput {
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
}

interface CreateSessionAttemptInput extends ListSessionAttemptsInput {
  sessionType: SessionAttemptSessionType;
  attemptNumber: number;
  startedAt: string;
}

interface FinishSessionAttemptInput {
  attempt: SessionAttemptRecord;
  totalQuestions: number;
  correctAnswers: number;
  maxScore: number;
  obtainedScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  durationSeconds?: number;
}

interface SaveSessionAttemptProgressInput {
  attempt: SessionAttemptRecord;
  currentQuestionIndex: number;
  answeredQuestionIndexes: number[];
  answers: Record<string, SessionAttemptProgressAnswer>;
  checkedAnswers: Record<string, SessionAttemptProgressCheckedAnswer>;
  bookmarkedIndexes: number[];
  durationSeconds: number;
}

const buildPartitionKey = (userId: string): string => `${USER_PARTITION_KEY_PREFIX}${userId}`;

const buildSessionSortKeyPrefix = (
  productId: string,
  topicId: string,
  sessionId: string
): string => `${SESSION_ATTEMPT_SORT_KEY_PREFIX}${productId}#${topicId}#${sessionId}#`;

const isSessionAttemptRecord = (value: unknown): value is SessionAttemptRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.entityType === "SESSION_ATTEMPT";
};

export const listSessionAttempts = async (
  input: ListSessionAttemptsInput
): Promise<SessionAttemptRecord[]> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getLearningServiceEnv().DYNAMO_DB_TABLE_NAME;
  const partitionKey = buildPartitionKey(input.userId);
  const sortKeyPrefix = buildSessionSortKeyPrefix(input.productId, input.topicId, input.sessionId);

  try {
    const response = await selectItems<SessionAttemptRecord & Record<string, unknown>>(dynamoDbDocumentClient, {
      from: tableName,
      keyWhere: {
        PK: partitionKey
      },
      keyBeginsWith: {
        SK: sortKeyPrefix
      }
    });

    return response.items.filter(isSessionAttemptRecord);
  } catch (error) {
    logger.error("dynamodb.sessionAttempt.list.failure", {
      tableName,
      userId: input.userId,
      productId: input.productId,
      topicId: input.topicId,
      sessionId: input.sessionId,
      partitionKey,
      sortKeyPrefix,
      error
    });
    throw error;
  }
};

export const createSessionAttempt = async (
  input: CreateSessionAttemptInput
): Promise<SessionAttemptRecord> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getLearningServiceEnv().DYNAMO_DB_TABLE_NAME;
  const attemptId = randomUUID();
  const partitionKey = buildPartitionKey(input.userId);
  const sortKey = `${buildSessionSortKeyPrefix(input.productId, input.topicId, input.sessionId)}${input.startedAt}#${attemptId}`;

  const item: SessionAttemptRecord = {
    PK: partitionKey,
    SK: sortKey,
    entityType: "SESSION_ATTEMPT",
    attemptId,
    attemptNumber: input.attemptNumber,
    userId: input.userId,
    productId: input.productId,
    topicId: input.topicId,
    sessionId: input.sessionId,
    sessionType: input.sessionType,
    status: "ACTIVE",
    isActive: true,
    startedAt: input.startedAt,
    updatedAt: input.startedAt
  };

  try {
    await createItem(dynamoDbDocumentClient, {
      TableName: tableName,
      Item: item as SessionAttemptRecord & Record<string, unknown>
    });

    return item;
  } catch (error) {
    logger.error("dynamodb.sessionAttempt.create.failure", {
      tableName,
      userId: input.userId,
      productId: input.productId,
      topicId: input.topicId,
      sessionId: input.sessionId,
      sessionType: input.sessionType,
      attemptNumber: input.attemptNumber,
      startedAt: input.startedAt,
      error
    });
    throw error;
  }
};

export const finishSessionAttemptInRepository = async (
  input: FinishSessionAttemptInput
): Promise<SessionAttemptRecord> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getLearningServiceEnv().DYNAMO_DB_TABLE_NAME;
  const finishedAt = new Date().toISOString();

  try {
    const updatedAttempt = await updateItem<SessionAttemptRecord & Record<string, unknown>>(
      dynamoDbDocumentClient,
      {
        TableName: tableName,
        Key: {
          PK: input.attempt.PK,
          SK: input.attempt.SK
        },
        UpdateExpression: [
          "SET #status = :status",
          "#isActive = :isActive",
          "#finishedAt = :finishedAt",
          "#updatedAt = :updatedAt",
          "#totalQuestions = :totalQuestions",
          "#correctAnswers = :correctAnswers",
          "#maxScore = :maxScore",
          "#obtainedScore = :obtainedScore",
          "#percentage = :percentage",
          "#passingScore = :passingScore",
          "#passed = :passed",
          "#durationSeconds = :durationSeconds"
        ].join(", "),
        ExpressionAttributeNames: {
          "#status": "status",
          "#isActive": "isActive",
          "#finishedAt": "finishedAt",
          "#updatedAt": "updatedAt",
          "#totalQuestions": "totalQuestions",
          "#correctAnswers": "correctAnswers",
          "#maxScore": "maxScore",
          "#obtainedScore": "obtainedScore",
          "#percentage": "percentage",
          "#passingScore": "passingScore",
          "#passed": "passed",
          "#durationSeconds": "durationSeconds"
        },
        ExpressionAttributeValues: {
          ":status": "FINISHED",
          ":isActive": false,
          ":finishedAt": finishedAt,
          ":updatedAt": finishedAt,
          ":totalQuestions": input.totalQuestions,
          ":correctAnswers": input.correctAnswers,
          ":maxScore": input.maxScore,
          ":obtainedScore": input.obtainedScore,
          ":percentage": input.percentage,
          ":passingScore": input.passingScore,
          ":passed": input.passed,
          ":durationSeconds": input.durationSeconds ?? 0
        }
      }
    );

    if (!updatedAttempt) {
      throw new Error("Failed to update session attempt");
    }

    return updatedAttempt;
  } catch (error) {
    logger.error("dynamodb.sessionAttempt.finish.failure", {
      tableName,
      userId: input.attempt.userId,
      productId: input.attempt.productId,
      topicId: input.attempt.topicId,
      sessionId: input.attempt.sessionId,
      attemptId: input.attempt.attemptId,
      error
    });
    throw error;
  }
};

export const saveSessionAttemptProgressInRepository = async (
  input: SaveSessionAttemptProgressInput
): Promise<SessionAttemptRecord> => {
  const dynamoDbDocumentClient = createDynamoDocumentClient();
  const tableName = getLearningServiceEnv().DYNAMO_DB_TABLE_NAME;
  const savedAt = new Date().toISOString();

  try {
    const updatedAttempt = await updateItem<SessionAttemptRecord & Record<string, unknown>>(
      dynamoDbDocumentClient,
      {
        TableName: tableName,
        Key: {
          PK: input.attempt.PK,
          SK: input.attempt.SK
        },
        UpdateExpression: [
          "SET #updatedAt = :updatedAt",
          "#progressSavedAt = :progressSavedAt",
          "#progressCurrentQuestionIndex = :progressCurrentQuestionIndex",
          "#progressAnsweredQuestionIndexes = :progressAnsweredQuestionIndexes",
          "#progressAnswers = :progressAnswers",
          "#progressCheckedAnswers = :progressCheckedAnswers",
          "#progressBookmarkedIndexes = :progressBookmarkedIndexes",
          "#progressDurationSeconds = :progressDurationSeconds"
        ].join(", "),
        ExpressionAttributeNames: {
          "#updatedAt": "updatedAt",
          "#progressSavedAt": "progressSavedAt",
          "#progressCurrentQuestionIndex": "progressCurrentQuestionIndex",
          "#progressAnsweredQuestionIndexes": "progressAnsweredQuestionIndexes",
          "#progressAnswers": "progressAnswers",
          "#progressCheckedAnswers": "progressCheckedAnswers",
          "#progressBookmarkedIndexes": "progressBookmarkedIndexes",
          "#progressDurationSeconds": "progressDurationSeconds"
        },
        ExpressionAttributeValues: {
          ":updatedAt": savedAt,
          ":progressSavedAt": savedAt,
          ":progressCurrentQuestionIndex": input.currentQuestionIndex,
          ":progressAnsweredQuestionIndexes": input.answeredQuestionIndexes,
          ":progressAnswers": input.answers,
          ":progressCheckedAnswers": input.checkedAnswers,
          ":progressBookmarkedIndexes": input.bookmarkedIndexes,
          ":progressDurationSeconds": input.durationSeconds
        },
        ReturnValues: "ALL_NEW"
      }
    );

    if (!updatedAttempt) {
      throw new Error("Failed to update session attempt progress");
    }

    return updatedAttempt;
  } catch (error) {
    logger.error("dynamodb.sessionAttempt.saveProgress.failure", {
      tableName,
      attemptId: input.attempt.attemptId,
      userId: input.attempt.userId,
      productId: input.attempt.productId,
      topicId: input.attempt.topicId,
      sessionId: input.attempt.sessionId,
      error
    });
    throw error;
  }
};
