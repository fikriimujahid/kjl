import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse } from "@shared-utils/response";
import {
  AuthenticationRequiredError,
  ForbiddenProductAccessError,
  ProductNotFoundError
} from "./applicationErrors";

export interface ProductErrorFallback {
  statusCode: number;
  message: string;
  code: string;
}

export const mapProductErrorToResponse = (
  event: APIGatewayProxyEventV2,
  error: unknown,
  fallback: ProductErrorFallback
): APIGatewayProxyStructuredResultV2 => {
  if (error instanceof ProductNotFoundError) {
    return createErrorResponse(event, 404, error.message, {
      code: "PRODUCT_NOT_FOUND"
    });
  }

  if (error instanceof AuthenticationRequiredError) {
    return createErrorResponse(event, 401, error.message, {
      code: "UNAUTHORIZED"
    });
  }

  if (error instanceof ForbiddenProductAccessError) {
    return createErrorResponse(event, 403, error.message, {
      code: "FORBIDDEN"
    });
  }

  return createErrorResponse(event, fallback.statusCode, fallback.message, {
    code: fallback.code
  });
};