import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, extractRefreshToken } from "../utils/cookies";
import { jsonResponse } from "../utils/response";
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

  return jsonResponse(
    event,
    200,
    {
      success: true
    },
    {
      cookies: [buildClearRefreshCookie()]
    }
  );
};
