import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface GetOwnedProductsRequest {
  userId: string;
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

const readUserId = (payload: Record<string, unknown>): string | null => {
  const value = payload.userId;

  if (typeof value !== "string") {
    return null;
  }

  return value.length > 0 ? value : null;
};

const safeParsePayload = (input: unknown): SafeParseResult<GetOwnedProductsRequest> => {
  const payload = normalizePayloadObject(input);
  const userId = readUserId(payload);

  if (!userId) {
    return {
      success: false,
      error: "Missing user id"
    };
  }

  return {
    success: true,
    data: {
      userId
    }
  };
};

export const getOwnedProductsSchema = {
  safeParse: (input: unknown): SafeParseResult<GetOwnedProductsRequest> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<GetOwnedProductsRequest> => {
    try {
      parseEventBody(event);
      return safeParsePayload({ userId: event.pathParameters?.userId });
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};