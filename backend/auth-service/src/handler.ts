import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { login } from "./handlers/login";
import { logout } from "./handlers/logout";
import { optionsResponse, jsonResponse } from "./utils/response";
import { refresh } from "./handlers/refresh";
import { session } from "./handlers/session";
import { register } from "./handlers/register";
import { forgotPassword } from "./handlers/forgotPassword";
import { confirmPasswordReset } from "./handlers/confirmForgotPassword";
import { ROUTES } from "./routes";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse(event);
  }

  if (event.routeKey === ROUTES.LOGIN.routeKey) {
    return login(event);
  }

  if (event.routeKey === ROUTES.FORGOT_PASSWORD.routeKey) {
    return forgotPassword(event);
  }

  if (event.routeKey === ROUTES.CONFIRM_FORGOT_PASSWORD.routeKey) {
    return confirmPasswordReset(event);
  }

  if (event.routeKey === ROUTES.REGISTER.routeKey) {
    return register(event);
  }

  if (event.routeKey === ROUTES.REFRESH.routeKey) {
    return refresh(event);
  }

  if (event.routeKey === ROUTES.LOGOUT.routeKey) {
    return logout(event);
  }

  if (event.routeKey === ROUTES.SESSION.routeKey) {
    return session(event);
  }

  return jsonResponse(event, 404, { message: "Route not found" });
};

export const main = handler;
