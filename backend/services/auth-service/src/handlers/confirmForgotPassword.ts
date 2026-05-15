import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { confirmForgotPassword } from "../services/cognito";

export const confirmPasswordReset = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return createErrorResponse(event, 400, "Invalid JSON body", { code: "INVALID_JSON" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const code = typeof payload.code === "string" ? payload.code.trim() : "";
  const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

  if (!email || !code || !newPassword) {
    return createErrorResponse(event, 400, "email, code, and newPassword are required", {
      code: "VALIDATION_ERROR"
    });
  }

  try {
    await confirmForgotPassword(email, code, newPassword);
    return createSuccessResponse(event, 200, { passwordResetConfirmed: true });
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return createErrorResponse(event, error.statusCode, error.message, { code: error.code });
    }

    return createErrorResponse(event, 500, "Failed to confirm password reset", {
      code: "CONFIRM_PASSWORD_RESET_FAILED"
    });
  }
};
