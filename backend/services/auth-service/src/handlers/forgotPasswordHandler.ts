import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { forgotPassword } from "../use-cases/forgotPassword";

export const forgotPasswordHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  let payload: Record<string, unknown>;

  try {
    payload = parseEventBody(event);
  } catch {
    return createErrorResponse(event, 400, "Invalid JSON body", { code: "INVALID_JSON" });
  }

  const email = typeof payload.email === "string" ? payload.email.trim() : "";

  if (!email) {
    return createErrorResponse(event, 400, "email is required", { code: "VALIDATION_ERROR" });
  }

  try {
    const result = await forgotPassword({ email });
    return createSuccessResponse(event, 200, {
      codeDeliveryDetails: result.codeDeliveryDetails
    });
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Failed to request password reset",
      code: "FORGOT_PASSWORD_FAILED"
    });
  }
};