import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface CheckSessionAnswerRequest {
  productId: string;
  topicId: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: string;
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

const safeParsePayload = (input: unknown): SafeParseResult<CheckSessionAnswerRequest> => {
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

  if (!isNonEmptyString(payload.questionId)) {
    return {
      success: false,
      error: "Missing question id"
    };
  }

  if (!isNonEmptyString(payload.selectedOptionId)) {
    return {
      success: false,
      error: "Missing selected option id"
    };
  }

  return {
    success: true,
    data: {
      productId: payload.productId.trim(),
      topicId: payload.topicId.trim(),
      sessionId: payload.sessionId.trim(),
      questionId: payload.questionId.trim(),
      selectedOptionId: payload.selectedOptionId.trim()
    }
  };
};

export const checkSessionAnswerSchema = {
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<CheckSessionAnswerRequest> => {
    try {
      const body = parseEventBody(event) as unknown;

      return safeParsePayload({
        productId: event.pathParameters?.productId,
        topicId: event.pathParameters?.topicId,
        sessionId: event.pathParameters?.sessionId,
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
