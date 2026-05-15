import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie } from "@shared-utils/cookies";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapAuthErrorToResponse } from "../errors/errorToResponse";
import { login } from "../use-cases/login";

export const loginHandler = async (
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

  if (!email || !password) {
    return createErrorResponse(event, 400, "email and password are required", {
      code: "VALIDATION_ERROR"
    });
  }

  try {
    const result = await login({ email, password });

    return createSuccessResponse(
      event,
      200,
      {
        accessToken: result.accessToken,
        idToken: result.idToken,
        expiresIn: result.expiresIn,
        tokenType: result.tokenType,
        user: result.user
      },
      {
        cookies: [buildRefreshCookie(result.refreshToken)]
      }
    );
  } catch (error) {
    return mapAuthErrorToResponse(event, error, {
      statusCode: 500,
      message: "Login failed",
      code: "LOGIN_FAILED"
    });
  }
};