import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";
import { SessionAttemptFinishAnswerInput } from "../types/learningTypes";

interface FinishSessionAttemptRequest {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  answers: SessionAttemptFinishAnswerInput[];
  durationSeconds?: number;
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

const isNonNegativeFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
};

const isFinishAnswerInput = (value: unknown): value is SessionAttemptFinishAnswerInput => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  if (!isNonEmptyString(candidate.questionId)) {
    return false;
  }

  return typeof candidate.selectedOptionId === "string";
};

const safeParsePayload = (input: unknown): SafeParseResult<FinishSessionAttemptRequest> => {
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

  if (!Array.isArray(payload.answers) || payload.answers.length === 0) {
    return {
      success: false,
      error: "Invalid answers"
    };
  }

  if (!payload.answers.every(isFinishAnswerInput)) {
    return {
      success: false,
      error: "Invalid answer entry"
    };
  }

  if (payload.durationSeconds !== undefined && !isNonNegativeFiniteNumber(payload.durationSeconds)) {
    return {
      success: false,
      error: "Invalid duration seconds"
    };
  }

  return {
    success: true,
    data: {
      productId: payload.productId.trim(),
      topicId: payload.topicId.trim(),
      sessionId: payload.sessionId.trim(),
      attemptId: payload.attemptId.trim(),
      answers: payload.answers.map((answer) => ({
        questionId: answer.questionId.trim(),
        selectedOptionId: answer.selectedOptionId.trim()
      })),
      durationSeconds: payload.durationSeconds
    }
  };
};

export const finishSessionAttemptSchema = {
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<FinishSessionAttemptRequest> => {
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
