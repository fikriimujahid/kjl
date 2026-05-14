import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError, registerWithPassword } from "../services/cognito";

export const register = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return createErrorResponse(event, 400, "Invalid JSON body", { code: "INVALID_JSON" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";
  const password = typeof payload.password === "string" ? payload.password : "";
  const fullName = typeof payload.fullName === "string" ? payload.fullName.trim() : "";

  if (!email || !password || !fullName) {
    return createErrorResponse(event, 400, "fullName, email, and password are required", {
      code: "VALIDATION_ERROR"
    });
  }

  try {
    const result = await registerWithPassword(email, password, fullName);

    return createSuccessResponse(event, 200, {
      userConfirmed: result.userConfirmed,
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return createErrorResponse(event, error.statusCode, error.message, { code: error.code });
    }

    return createErrorResponse(event, 500, "Registration failed", { code: "REGISTRATION_FAILED" });
  }
};
