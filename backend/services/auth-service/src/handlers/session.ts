import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, buildRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { getAuthUserFromIdToken } from "@shared-auth/token";
import { refreshWithToken } from "@shared-auth/cognito";

export const session = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (!refreshToken) {
    return createSuccessResponse(event, 200, { authenticated: false });
  }

  try {
    const authResult = await refreshWithToken(refreshToken);
    const user = getAuthUserFromIdToken(authResult.idToken);

    if (!user) {
      return createSuccessResponse(
        event,
        200,
        { authenticated: false },
        { cookies: [buildClearRefreshCookie()] }
      );
    }

    const nextRefreshToken = authResult.refreshToken ?? refreshToken;

    return createSuccessResponse(
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
    return createSuccessResponse(
      event,
      200,
      { authenticated: false },
      { cookies: [buildClearRefreshCookie()] }
    );
  }
};
