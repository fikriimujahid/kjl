import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";
import {
  SessionAttemptProgressAnswer,
  SessionAttemptProgressCheckedAnswer
} from "../types/learningTypes";

interface SaveSessionAttemptProgressRequest {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  currentQuestionIndex: number;
  answeredQuestionIndexes: number[];
  answers: Record<string, SessionAttemptProgressAnswer>;
  checkedAnswers: Record<string, SessionAttemptProgressCheckedAnswer>;
  bookmarkedIndexes: number[];
  durationSeconds: number;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: string;
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === "string" && value.trim().length > 0;
};

const isNonNegativeInteger = (value: unknown): value is number => {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
};

const isProgressAnswer = (value: unknown): value is SessionAttemptProgressAnswer => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return isNonEmptyString(candidate.option) && isNonEmptyString(candidate.optionId);
};

const isProgressCheckedAnswer = (value: unknown): value is SessionAttemptProgressCheckedAnswer => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (
    !isNonEmptyString(candidate.questionId)
    || !isNonEmptyString(candidate.selectedOptionId)
    || !isNonEmptyString(candidate.correctAnswer)
    || typeof candidate.isCorrect !== "boolean"
    || typeof candidate.score !== "number"
    || typeof candidate.awardedScore !== "number"
  ) {
    return false;
  }

  if (candidate.explanation !== undefined && typeof candidate.explanation !== "string") {
    return false;
  }

  return true;
};

const parseIndexArray = (value: unknown): number[] | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  if (!value.every(isNonNegativeInteger)) {
    return null;
  }

  return value;
};

const parseRecord = <T>(value: unknown, guard: (input: unknown) => input is T): Record<string, T> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const output: Record<string, T> = {};

  for (const [key, itemValue] of Object.entries(candidate)) {
    if (!guard(itemValue)) {
      return null;
    }

    output[key] = itemValue;
  }

  return output;
};

const safeParsePayload = (input: unknown): SafeParseResult<SaveSessionAttemptProgressRequest> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      success: false,
      error: "Invalid request payload"
    };
  }

  const payload = input as Record<string, unknown>;

  if (!isNonEmptyString(payload.productId)) {
    return {
      success: false,
      error: "Missing product id"
    };
  }

  if (!isNonEmptyString(payload.topicId)) {
    return {
      success: false,
      error: "Missing topic id"
    };
  }

  if (!isNonEmptyString(payload.sessionId)) {
    return {
      success: false,
      error: "Missing session id"
    };
  }

  if (!isNonEmptyString(payload.attemptId)) {
    return {
      success: false,
      error: "Missing attempt id"
    };
  }

  if (!isNonNegativeInteger(payload.currentQuestionIndex)) {
    return {
      success: false,
      error: "Invalid current question index"
    };
  }

  const answeredQuestionIndexes = parseIndexArray(payload.answeredQuestionIndexes);
  if (!answeredQuestionIndexes) {
    return {
      success: false,
      error: "Invalid answered question indexes"
    };
  }

  const bookmarkedIndexes = parseIndexArray(payload.bookmarkedIndexes);
  if (!bookmarkedIndexes) {
    return {
      success: false,
      error: "Invalid bookmarked indexes"
    };
  }

  if (!isNonNegativeInteger(payload.durationSeconds)) {
    return {
      success: false,
      error: "Invalid duration seconds"
    };
  }

  const answers = parseRecord(payload.answers, isProgressAnswer);
  if (!answers) {
    return {
      success: false,
      error: "Invalid progress answers"
    };
  }

  const checkedAnswers = parseRecord(payload.checkedAnswers ?? {}, isProgressCheckedAnswer);
  if (!checkedAnswers) {
    return {
      success: false,
      error: "Invalid checked answers"
    };
  }

  return {
    success: true,
    data: {
      productId: payload.productId.trim(),
      topicId: payload.topicId.trim(),
      sessionId: payload.sessionId.trim(),
      attemptId: payload.attemptId.trim(),
      currentQuestionIndex: payload.currentQuestionIndex,
      answeredQuestionIndexes,
      answers,
      checkedAnswers,
      bookmarkedIndexes,
      durationSeconds: payload.durationSeconds
    }
  };
};

export const saveSessionAttemptProgressSchema = {
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<SaveSessionAttemptProgressRequest> => {
    try {
      const body = parseEventBody(event) as unknown;

      return safeParsePayload({
        productId: event.pathParameters?.productId,
        topicId: event.pathParameters?.topicId,
        sessionId: event.pathParameters?.sessionId,
        attemptId: event.pathParameters?.attemptId,
        ...(body && typeof body === "object" ? body : {})
      });
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};
