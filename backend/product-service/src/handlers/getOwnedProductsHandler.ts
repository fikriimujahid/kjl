import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { getOwnedProducts } from "../services/productService";
import { jsonResponse } from "../utils/response";

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
    return jsonResponse(400, { message: "Missing user id" });
  }

  const authenticatedUserId = getAuthenticatedUserId(event);

  if (!authenticatedUserId) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  if (authenticatedUserId !== userId) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  try {
    const purchases = await getOwnedProducts(userId);
    return jsonResponse(200, purchases);
  } catch {
    return jsonResponse(502, { message: "Failed to load purchased product data" });
  }
};
