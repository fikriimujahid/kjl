import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createLogger } from "@shared-utils/logger";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { getAuthServiceEnv } from "./config/env";
import { confirmForgotPasswordHandler } from "./handlers/confirmForgotPasswordHandler";
import { forgotPasswordHandler } from "./handlers/forgotPasswordHandler";
import { loginHandler } from "./handlers/loginHandler";
import { logoutHandler } from "./handlers/logoutHandler";
import { refreshHandler } from "./handlers/refreshHandler";
import { registerHandler } from "./handlers/registerHandler";
import { sessionHandler } from "./handlers/sessionHandler";
import { ROUTES } from "./routes";

getAuthServiceEnv();

const logger = createLogger("auth-service");

const routeHandlers: Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
> = {
  [ROUTES.LOGIN.routeKey]: loginHandler,
  [ROUTES.FORGOT_PASSWORD.routeKey]: forgotPasswordHandler,
  [ROUTES.CONFIRM_FORGOT_PASSWORD.routeKey]: confirmForgotPasswordHandler,
  [ROUTES.REGISTER.routeKey]: registerHandler,
  [ROUTES.REFRESH.routeKey]: refreshHandler,
  [ROUTES.LOGOUT.routeKey]: logoutHandler,
  [ROUTES.SESSION.routeKey]: sessionHandler
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  logger.info("request.received", {
    requestId: event.requestContext?.requestId,
    routeKey: event.routeKey,
    method: event.requestContext.http.method
  });

  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse(event);
  }

  const routeHandler = routeHandlers[event.routeKey ?? ""];
  if (routeHandler) {
    return routeHandler(event);
  }

  logger.warn("request.route_not_found", {
    requestId: event.requestContext?.requestId,
    routeKey: event.routeKey,
    method: event.requestContext.http.method
  });

  return createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" });
};

export const main = handler;
