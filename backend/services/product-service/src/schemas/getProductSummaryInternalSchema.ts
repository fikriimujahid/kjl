import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface GetProductDetailsRequest {
  productId: string;
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

const readProductId = (payload: Record<string, unknown>): string | null => {
  const value = payload.productId;

  if (typeof value !== "string") {
    return null;
  }

  return value.length > 0 ? value : null;
};

const safeParsePayload = (input: unknown): SafeParseResult<GetProductDetailsRequest> => {
  const payload = normalizePayloadObject(input);
  const productId = readProductId(payload);

  if (!productId) {
    return {
      success: false,
      error: "Missing product id"
    };
  }

  return {
    success: true,
    data: {
      productId
    }
  };
};

export const getProductSummaryInternalSchema = {
  safeParse: (input: unknown): SafeParseResult<GetProductDetailsRequest> => {
    return safeParsePayload(input);
  },
  safeParseEvent: (
    event: APIGatewayProxyEventV2
  ): SafeParseResult<GetProductDetailsRequest> => {
    try {
      parseEventBody(event);
      return safeParsePayload({ productId: event.pathParameters?.id });
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};