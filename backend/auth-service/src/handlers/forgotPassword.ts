import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { CognitoOperationError, requestForgotPassword } from "../services/cognito";

export const forgotPassword = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(event, 400, { message: "Invalid JSON body" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (!email) {
    return jsonResponse(event, 400, { message: "email is required" });
  }

  try {
    const result = await requestForgotPassword(email);
    return jsonResponse(event, 200, {
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return jsonResponse(event, error.statusCode, { message: error.message, code: error.code });
    }

    return jsonResponse(event, 500, { message: "Failed to request password reset" });
  }
};
