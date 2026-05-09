import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildRefreshCookie, extractRefreshToken } from "../utils/cookies";
import { jsonResponse } from "../utils/response";
import { getAuthUserFromIdToken } from "../utils/token";
import { CognitoOperationError, refreshWithToken } from "../services/cognito";

export const refresh = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (!refreshToken) {
    return jsonResponse(event, 401, { message: "Refresh token not found" });
  }

  try {
    const authResult = await refreshWithToken(refreshToken);
    const user = getAuthUserFromIdToken(authResult.idToken);

    if (!user) {
      return jsonResponse(event, 502, { message: "Invalid ID token in refresh response" });
    }

    const nextRefreshToken = authResult.refreshToken ?? refreshToken;

    return jsonResponse(
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
      return jsonResponse(event, error.statusCode, { message: error.message, code: error.code });
    }

    return jsonResponse(event, 500, { message: "Failed to refresh session" });
  }
};
