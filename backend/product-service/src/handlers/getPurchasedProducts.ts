import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { listPurchasedProductsByUser } from "../services/productService";
import { jsonResponse } from "../utils/response";

export const getPurchasedProducts = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const userId = event.pathParameters?.userId;
  const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
    ?.claims as Record<string, string> | undefined;
  const authenticatedUserId = claims?.sub ?? claims?.["cognito:username"];

  if (!userId) {
    return jsonResponse(400, { message: "Missing user id" });
  }

  if (!authenticatedUserId) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  if (authenticatedUserId !== userId) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  try {
    const purchases = await listPurchasedProductsByUser(userId);
    return jsonResponse(200, purchases);
  } catch {
    return jsonResponse(502, { message: "Failed to load purchased product data" });
  }
};
