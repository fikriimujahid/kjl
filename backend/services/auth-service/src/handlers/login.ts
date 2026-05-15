import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie } from "@shared-utils/cookies";
import { parseEventBody } from "@shared-utils/request";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { getAuthUserFromIdToken } from "../services/token";
import { loginWithPassword } from "../services/cognito";

export const login = async (
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
    const authResult = await loginWithPassword(email, password); 
    const user = getAuthUserFromIdToken(authResult.idToken) ?? {
      id: email,
      email,
      name: email.split("@")[0] || "Pengguna"
    };

    return createSuccessResponse(
      event,
      200,
      {
        accessToken: authResult.accessToken,
        idToken: authResult.idToken,
        expiresIn: authResult.expiresIn,
        tokenType: authResult.tokenType,
        user
      },
      {
        cookies: [buildRefreshCookie(authResult.refreshToken ?? "")]
      }
    );
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return createErrorResponse(event, error.statusCode, error.message, { code: error.code });
    }

    return createErrorResponse(event, 500, "Login failed", { code: "LOGIN_FAILED" });
  }
};
