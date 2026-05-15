import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { buildClearRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createSuccessResponse } from "@shared-utils/response";
import { logout } from "../use-cases/logout";

export const logoutHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const refreshToken = extractRefreshToken(event);

  await logout({ refreshToken });

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