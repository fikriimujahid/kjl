import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { getPurchasedProductDetailsByUser } from "../services/purchasedProductService";
import { jsonResponse } from "../utils/response";

export const getPurchasedProductDetails = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const userId = event.pathParameters?.userId;
  const productId = event.pathParameters?.productId ?? event.pathParameters?.products;
  const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt?.claims as Record<string, string> | undefined;
  const authenticatedUserId = claims?.sub ?? claims?.["cognito:username"];

  if (!userId) {
    return jsonResponse(400, { message: "Missing user id" });
  }

  if (!productId) {
    return jsonResponse(400, { message: "Missing product id" });
  }

  if (!authenticatedUserId) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  if (authenticatedUserId !== userId) {
    return jsonResponse(403, { message: "Forbidden" });
  }

  try {
    const result = await getPurchasedProductDetailsByUser(userId, productId);

    if (result.status === "purchase-not-found") {
      return jsonResponse(404, { message: "Purchased product not found" });
    }

    if (result.status === "purchase-expired") {
      return jsonResponse(403, { message: "Purchased product access has expired" });
    }

    if (result.status === "product-not-found") {
      return jsonResponse(404, { message: "Product not found" });
    }

    return jsonResponse(200, result.product);
  } catch {
    return jsonResponse(502, { message: "Failed to load purchased product data" });
  }
};
