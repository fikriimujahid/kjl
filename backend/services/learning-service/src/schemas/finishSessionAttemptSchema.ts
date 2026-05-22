import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface FinishSessionAttemptRequest {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  totalQuestions: number;
  correctAnswers: number;
  maxScore: number;
  obtainedScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
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

  if (!isNonNegativeFiniteNumber(payload.totalQuestions)) {
    return {
      success: false,
      error: "Invalid total questions"
    };
  }

  if (!isNonNegativeFiniteNumber(payload.correctAnswers)) {
    return {
      success: false,
      error: "Invalid correct answers"
    };
  }

  if (!isNonNegativeFiniteNumber(payload.maxScore)) {
    return {
      success: false,
      error: "Invalid max score"
    };
  }

  if (!isNonNegativeFiniteNumber(payload.obtainedScore)) {
    return {
      success: false,
      error: "Invalid obtained score"
    };
  }

  if (!isNonNegativeFiniteNumber(payload.percentage)) {
    return {
      success: false,
      error: "Invalid percentage"
    };
  }

  if (!isNonNegativeFiniteNumber(payload.passingScore)) {
    return {
      success: false,
      error: "Invalid passing score"
    };
  }

  if (typeof payload.passed !== "boolean") {
    return {
      success: false,
      error: "Invalid passed flag"
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
      totalQuestions: payload.totalQuestions,
      correctAnswers: payload.correctAnswers,
      maxScore: payload.maxScore,
      obtainedScore: payload.obtainedScore,
      percentage: payload.percentage,
      passingScore: payload.passingScore,
      passed: payload.passed,
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
