import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface GetSessionByIdInternalRequest {
  productId: string;
  topicId: string;
  sessionId: string;
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

const normalizePayloadObject = (input: unknown): Record<string, unknown> => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {};
  }

  return input as Record<string, unknown>;
};

const readRequiredString = (
  payload: Record<string, unknown>,
  key: keyof GetSessionByIdInternalRequest,
  label: string
): string | SafeParseFailure => {
  const value = payload[key];

  if (typeof value !== "string" || value.length === 0) {
    return {
      success: false,
      error: `Missing ${label}`
    };
  }

  return value;
};

const safeParsePayload = (input: unknown): SafeParseResult<GetSessionByIdInternalRequest> => {
  const payload = normalizePayloadObject(input);

  const productId = readRequiredString(payload, "productId", "product id");
  if (typeof productId !== "string") {
    return productId;
  }

  const topicId = readRequiredString(payload, "topicId", "topic id");
  if (typeof topicId !== "string") {
    return topicId;
  }

  const sessionId = readRequiredString(payload, "sessionId", "session id");
  if (typeof sessionId !== "string") {
    return sessionId;
  }

  return {
    success: true,
    data: {
      productId,
      topicId,
      sessionId
    }
  };
};

export const getSessionByIdInternalSchema = {
  safeParse: (input: unknown): SafeParseResult<GetSessionByIdInternalRequest> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<GetSessionByIdInternalRequest> => {
    try {
      parseEventBody(event);
      return safeParsePayload({
        productId: event.pathParameters?.productId,
        topicId: event.pathParameters?.topicId,
        sessionId: event.pathParameters?.sessionId
      });
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};