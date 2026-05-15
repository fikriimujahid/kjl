import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ROUTES } from "../../src/routes";
import { handler } from "../../src/handler";
import { getAuthServiceEnv } from "../../src/config/env";
import { optionsResponse, createErrorResponse } from "@shared-utils/response";
import { login } from "../../src/handlers/login";
import { register } from "../../src/handlers/register";
import { forgotPassword } from "../../src/handlers/forgotPassword";
import { confirmPasswordReset } from "../../src/handlers/confirmForgotPassword";
import { refresh } from "../../src/handlers/refresh";
import { logout } from "../../src/handlers/logout";
import { session } from "../../src/handlers/session";

jest.mock("../../src/config/env", () => ({
  getAuthServiceEnv: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  optionsResponse: jest.fn(),
  createErrorResponse: jest.fn()
}));

jest.mock("../../src/handlers/login", () => ({ login: jest.fn() }));
jest.mock("../../src/handlers/register", () => ({ register: jest.fn() }));
jest.mock("../../src/handlers/forgotPassword", () => ({ forgotPassword: jest.fn() }));
jest.mock("../../src/handlers/confirmForgotPassword", () => ({ confirmPasswordReset: jest.fn() }));
jest.mock("../../src/handlers/refresh", () => ({ refresh: jest.fn() }));
jest.mock("../../src/handlers/logout", () => ({ logout: jest.fn() }));
jest.mock("../../src/handlers/session", () => ({ session: jest.fn() }));

const createEvent = (
  routeKey: string,
  method: string = "POST"
): APIGatewayProxyEventV2 =>
  ({
    routeKey,
    requestContext: {
      http: {
        method
      }
    }
  }) as APIGatewayProxyEventV2;

describe("handler entrypoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("loads env eagerly during module initialization", () => {
    jest.resetModules();

    jest.isolateModules(() => {
      require("../../src/handler");
      const envModule = require("../../src/config/env");

      expect(envModule.getAuthServiceEnv).toHaveBeenCalledTimes(1);
    });
  });

  it("returns CORS options response on OPTIONS method", async () => {
    const event = createEvent("OPTIONS /any", "OPTIONS");
    const optionsResult = { statusCode: 204 } as APIGatewayProxyStructuredResultV2;
    (optionsResponse as jest.Mock).mockReturnValue(optionsResult);

    const result = await handler(event);

    expect(optionsResponse).toHaveBeenCalledWith(event);
    expect(result).toBe(optionsResult);
  });

  it.each([
    [ROUTES.LOGIN.routeKey, login],
    [ROUTES.REGISTER.routeKey, register],
    [ROUTES.FORGOT_PASSWORD.routeKey, forgotPassword],
    [ROUTES.CONFIRM_FORGOT_PASSWORD.routeKey, confirmPasswordReset],
    [ROUTES.REFRESH.routeKey, refresh],
    [ROUTES.LOGOUT.routeKey, logout],
    [ROUTES.SESSION.routeKey, session]
  ])("dispatches route %s to its handler", async (routeKey, routeHandler) => {
    const event = createEvent(routeKey as string, routeKey === ROUTES.SESSION.routeKey ? "GET" : "POST");
    const expected = { statusCode: 200, body: JSON.stringify({ ok: true }) };

    (routeHandler as jest.Mock).mockResolvedValue(expected);

    const result = await handler(event);

    expect(routeHandler).toHaveBeenCalledWith(event);
    expect(result).toBe(expected);
  });

  it("returns 404 when route is not defined", async () => {
    const event = createEvent("GET /api/auth/unknown", "GET");
    const notFound = { statusCode: 404 } as APIGatewayProxyStructuredResultV2;

    (createErrorResponse as jest.Mock).mockReturnValue(notFound);

    const result = await handler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
  });
});
