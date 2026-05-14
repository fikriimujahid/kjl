import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { revokeRefreshToken } from "../services/cognito";

export const logout = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (refreshToken) {
    try {
      await revokeRefreshToken(refreshToken);
    } catch {
      // Continue logout flow even when revoke fails to ensure local cookie is removed.
    }
  }

  return createSuccessResponse(
    event,
    200,
    {
      loggedOut: true
    },
    {
      cookies: [buildClearRefreshCookie()]
    }
  );
};
