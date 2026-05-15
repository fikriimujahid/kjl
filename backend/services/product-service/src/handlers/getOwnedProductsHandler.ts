import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getOwnedProducts } from "../services/productService";

const getAuthenticatedUserId = (event: APIGatewayProxyEventV2): string | undefined => {
  const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
    ?.claims as Record<string, string> | undefined;

  return claims?.sub ?? claims?.["cognito:username"];
};

export const getOwnedProductsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return createErrorResponse(event, 400, "Missing user id", { code: "VALIDATION_ERROR" });
  }

  const authenticatedUserId = getAuthenticatedUserId(event);

  if (!authenticatedUserId) {
    return createErrorResponse(event, 401, "Unauthorized", { code: "UNAUTHORIZED" });
  }

  if (authenticatedUserId !== userId) {
    return createErrorResponse(event, 403, "Forbidden", { code: "FORBIDDEN" });
  }

  try {
    const purchases = await getOwnedProducts(userId);
    return createSuccessResponse(event, 200, purchases);
  } catch {
    return createErrorResponse(event, 502, "Failed to load purchased product data", {
      code: "OWNED_PRODUCTS_FETCH_FAILED"
    });
  }
};
