import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, buildRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { session } from "../use-cases/session";

export const sessionHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  if (!refreshToken) {
    return createSuccessResponse(event, 200, { authenticated: false });
  }

  const result = await session({ refreshToken });

  if (result.authenticated && result.session) {
    return createSuccessResponse(
      event,
      200,
      {
        authenticated: true,
        session: result.session
      },
      {
        cookies: [buildRefreshCookie(result.nextRefreshToken ?? refreshToken)]
      }
    );
  }

  if (result.clearRefreshCookie) {
    return createSuccessResponse(
      event,
      200,
      { authenticated: false },
      { cookies: [buildClearRefreshCookie()] }
    );
  }

  return createSuccessResponse(event, 200, { authenticated: false });
};