import {
  APIGatewayProxyEventV2,
  APIGatewayProxyEventV2WithJWTAuthorizer,
  APIGatewayProxyStructuredResultV2
} from "aws-lambda";
import { getProductSessionDetails } from "../services/productService";
import { jsonResponse } from "../utils/response";

export const getProductSessionDetailsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productId = event.pathParameters?.productId;
  const topicId = event.pathParameters?.topicId;
  const sessionId = event.pathParameters?.sessionId;
  const claims = (event as APIGatewayProxyEventV2WithJWTAuthorizer).requestContext.authorizer?.jwt
    ?.claims as Record<string, string> | undefined;
  const authenticatedUserId = claims?.sub ?? claims?.["cognito:username"];

  if (!authenticatedUserId) {
    return jsonResponse(401, { message: "Unauthorized" });
  }

  if (!productId || !topicId || !sessionId) {
    return jsonResponse(400, { message: "Missing session path parameters" });
  }

  try {
    const sessionDetails = await getProductSessionDetails(
      authenticatedUserId,
      productId,
      topicId,
      sessionId
    );

    if (!sessionDetails) {
      return jsonResponse(404, { message: "Session not found or not accessible" });
    }

    if (sessionDetails.length === 0) {
      return jsonResponse(404, { message: "Session media not found" });
    }

    return jsonResponse(200, sessionDetails);
  } catch {
    return jsonResponse(502, { message: "Failed to load session data" });
  }
};