import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, buildRefreshCookie, extractRefreshToken } from "../utils/cookies";
import { jsonResponse } from "../utils/response";
import { getAuthUserFromIdToken } from "../utils/token";
import { refreshWithToken } from "../services/cognito";

export const session = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (!refreshToken) {
    return jsonResponse(event, 200, { authenticated: false });
  }

  try {
    const authResult = await refreshWithToken(refreshToken);
    const user = getAuthUserFromIdToken(authResult.idToken);

    if (!user) {
      return jsonResponse(
        event,
        200,
        { authenticated: false },
        { cookies: [buildClearRefreshCookie()] }
      );
    }

    const nextRefreshToken = authResult.refreshToken ?? refreshToken;

    return jsonResponse(
      event,
      200,
      {
        authenticated: true,
        session: {
          accessToken: authResult.accessToken,
          idToken: authResult.idToken,
          expiresIn: authResult.expiresIn,
          tokenType: authResult.tokenType,
          user
        }
      },
      {
        cookies: [buildRefreshCookie(nextRefreshToken)]
      }
    );
  } catch {
    return jsonResponse(
      event,
      200,
      { authenticated: false },
      { cookies: [buildClearRefreshCookie()] }
    );
  }
};
