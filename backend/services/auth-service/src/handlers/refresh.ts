import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { CognitoOperationError } from "@shared-cognito/core";
import { getAuthUserFromIdToken } from "../services/token";
import { refreshWithToken } from "../services/cognito";

export const refresh = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (!refreshToken) {
    return createErrorResponse(event, 401, "Refresh token not found", {
      code: "REFRESH_TOKEN_NOT_FOUND"
    });
  }

  try {
    const authResult = await refreshWithToken(refreshToken);
    const user = getAuthUserFromIdToken(authResult.idToken);

    if (!user) {
      return createErrorResponse(event, 502, "Invalid ID token in refresh response", {
        code: "INVALID_ID_TOKEN"
      });
    }

    const nextRefreshToken = authResult.refreshToken ?? refreshToken;

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
        cookies: [buildRefreshCookie(nextRefreshToken)]
      }
    );
  } catch (error) {
    if (error instanceof CognitoOperationError) {
      return createErrorResponse(event, error.statusCode, error.message, { code: error.code });
    }

    return createErrorResponse(event, 500, "Failed to refresh session", {
      code: "REFRESH_FAILED"
    });
  }
};
