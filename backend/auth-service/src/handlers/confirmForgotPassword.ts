import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "../utils/request";
import { jsonResponse } from "../utils/response";
import { CognitoOperationError, confirmForgotPassword } from "../services/cognito";

export const confirmPasswordReset = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return jsonResponse(event, 400, { message: "Invalid JSON body" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (!email || !code || !newPassword) {
    return jsonResponse(event, 400, { message: "email, code, and newPassword are required" });
  }

  try {
    await confirmForgotPassword(email, code, newPassword);
    return jsonResponse(event, 200, { success: true });
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return jsonResponse(event, error.statusCode, { message: error.message, code: error.code });
    }

    return jsonResponse(event, 500, { message: "Failed to confirm password reset" });
  }
};
