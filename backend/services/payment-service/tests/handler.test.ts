import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { ROUTES } from "../src/routes";

jest.mock("../src/handlers/createPaymentHandler", () => ({
  createPaymentHandler: jest.fn()
}));

jest.mock("../src/handlers/getOwnedProductsHandler", () => ({
  getOwnedProductsHandler: jest.fn()
}));

jest.mock("../src/handlers/getOwnedProductsInternalHandler", () => ({
  getOwnedProductsInternalHandler: jest.fn()
}));

jest.mock("../src/handlers/getPaymentHistoryHandler", () => ({
  getPaymentHistoryHandler: jest.fn()
}));

jest.mock("../src/handlers/handleWebhookHandler", () => ({
  handleWebhookHandler: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
  optionsResponse: jest.fn()
}));

const ORIGINAL_ENV = process.env;

interface LoadedHandlerModule {
  handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;
  createPaymentMock: jest.Mock;
  getOwnedProductsMock: jest.Mock;
  getOwnedProductsInternalMock: jest.Mock;
  getPaymentHistoryMock: jest.Mock;
  handleWebhookMock: jest.Mock;
  createErrorResponseMock: jest.Mock;
  optionsResponseMock: jest.Mock;
}

const loadHandler = (): LoadedHandlerModule => {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    DYNAMO_DB_TABLE_NAME: "kjl-table",
    MIDTRANS_SERVER_KEY: "midtrans-key",
    MIDTRANS_SNAP_API_URL: "https://api.midtrans.test/snap",
    PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test",
    PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: "internal-secret"
  };

  const { clearEnvCache } = require("../src/config/env") as {
    clearEnvCache: () => void;
  };

  clearEnvCache();

  const { handler } = require("../src/handler") as {
    handler: (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>;
  };
  const { createPaymentHandler } = require("../src/handlers/createPaymentHandler") as {
    createPaymentHandler: jest.Mock;
  };
  const { getOwnedProductsHandler } = require("../src/handlers/getOwnedProductsHandler") as {
    getOwnedProductsHandler: jest.Mock;
  };
  const { getOwnedProductsInternalHandler } = require("../src/handlers/getOwnedProductsInternalHandler") as {
    getOwnedProductsInternalHandler: jest.Mock;
  };
  const { getPaymentHistoryHandler } = require("../src/handlers/getPaymentHistoryHandler") as {
    getPaymentHistoryHandler: jest.Mock;
  };
  const { handleWebhookHandler } = require("../src/handlers/handleWebhookHandler") as {
    handleWebhookHandler: jest.Mock;
  };
  const { createErrorResponse, optionsResponse } = require("@shared-utils/response") as {
    createErrorResponse: jest.Mock;
    optionsResponse: jest.Mock;
  };

  return {
    handler,
    createPaymentMock: createPaymentHandler,
    getOwnedProductsMock: getOwnedProductsHandler,
    getOwnedProductsInternalMock: getOwnedProductsInternalHandler,
    getPaymentHistoryMock: getPaymentHistoryHandler,
    handleWebhookMock: handleWebhookHandler,
    createErrorResponseMock: createErrorResponse,
    optionsResponseMock: optionsResponse
  };
};

describe("payment-service handler routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  const createEvent = (routeKey: string, method = "POST"): APIGatewayProxyEventV2 =>
    ({
      version: "2.0",
      routeKey,
      rawPath: "/api/payments",
      rawQueryString: "",
      headers: {},
      requestContext: {
        accountId: "test-account",
        apiId: "test-api",
        domainName: "localhost",
        domainPrefix: "localhost",
        http: {
          method,
          path: "/api/payments",
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "jest"
        },
        requestId: "req-1",
        routeKey,
        stage: "$default",
        time: "15/May/2026:00:00:00 +0000",
        timeEpoch: Date.now()
      },
      isBase64Encoded: false
    }) as APIGatewayProxyEventV2;

  it("returns CORS response for OPTIONS requests", async () => {
    const { handler, optionsResponseMock } = loadHandler();
    const event = createEvent("OPTIONS /api/payments/create", "OPTIONS");
    const optionsResult = { statusCode: 204, body: "" };

    optionsResponseMock.mockReturnValue(optionsResult);

    const result = await handler(event);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"request.succeeded"')
    );
    expect(optionsResponseMock).toHaveBeenCalledWith(event);
    expect(result).toBe(optionsResult);
  });

  it("dispatches create payment route", async () => {
    const { handler, createPaymentMock, getOwnedProductsMock, getOwnedProductsInternalMock, getPaymentHistoryMock, handleWebhookMock } = loadHandler();
    const event = createEvent(ROUTES.CREATE_PAYMENT.routeKey);
    const response = { statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2;

    createPaymentMock.mockResolvedValue(response);

    const result = await handler(event);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"request.succeeded"')
    );
    expect(createPaymentMock).toHaveBeenCalledWith(event);
        expect(getOwnedProductsMock).not.toHaveBeenCalled();
        expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(getPaymentHistoryMock).not.toHaveBeenCalled();
    expect(handleWebhookMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

      it("dispatches get owned products route", async () => {
        const { handler, createPaymentMock, getOwnedProductsMock, getOwnedProductsInternalMock, getPaymentHistoryMock, handleWebhookMock } = loadHandler();
        const event = createEvent(ROUTES.GET_OWNED_PRODUCTS.routeKey, "GET");
        const response = { statusCode: 200, body: "[]" } as APIGatewayProxyStructuredResultV2;

        getOwnedProductsMock.mockResolvedValue(response);

        const result = await handler(event);

        expect(getOwnedProductsMock).toHaveBeenCalledWith(event);
        expect(createPaymentMock).not.toHaveBeenCalled();
        expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
        expect(getPaymentHistoryMock).not.toHaveBeenCalled();
        expect(handleWebhookMock).not.toHaveBeenCalled();
        expect(result).toBe(response);
      });

      it("dispatches get internal owned products route", async () => {
        const { handler, createPaymentMock, getOwnedProductsMock, getOwnedProductsInternalMock, getPaymentHistoryMock, handleWebhookMock } = loadHandler();
        const event = createEvent(ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey, "GET");
        const response = { statusCode: 200, body: "[]" } as APIGatewayProxyStructuredResultV2;

        getOwnedProductsInternalMock.mockResolvedValue(response);

        const result = await handler(event);

        expect(getOwnedProductsInternalMock).toHaveBeenCalledWith(event);
        expect(createPaymentMock).not.toHaveBeenCalled();
        expect(getOwnedProductsMock).not.toHaveBeenCalled();
        expect(getPaymentHistoryMock).not.toHaveBeenCalled();
        expect(handleWebhookMock).not.toHaveBeenCalled();
        expect(result).toBe(response);
      });

  it("dispatches get payment history route", async () => {
        const { handler, createPaymentMock, getOwnedProductsMock, getOwnedProductsInternalMock, getPaymentHistoryMock, handleWebhookMock } = loadHandler();
    const event = createEvent(ROUTES.GET_PAYMENT_HISTORY.routeKey, "GET");
    const response = { statusCode: 200, body: "[]" } as APIGatewayProxyStructuredResultV2;

    getPaymentHistoryMock.mockResolvedValue(response);

    const result = await handler(event);

    expect(getPaymentHistoryMock).toHaveBeenCalledWith(event);
    expect(createPaymentMock).not.toHaveBeenCalled();
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(handleWebhookMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  it("dispatches webhook route", async () => {
    const { handler, createPaymentMock, getOwnedProductsMock, getOwnedProductsInternalMock, handleWebhookMock } = loadHandler();
    const event = createEvent(ROUTES.HANDLE_WEBHOOK.routeKey);
    const response = { statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2;

    handleWebhookMock.mockResolvedValue(response);

    const result = await handler(event);

    expect(handleWebhookMock).toHaveBeenCalledWith(event);
    expect(createPaymentMock).not.toHaveBeenCalled();
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  it("returns not found response for unsupported route", async () => {
    const { handler, createErrorResponseMock } = loadHandler();
    const event = createEvent("GET /api/payments/unknown", "GET");
    const notFound = {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        error: {
          message: "Route not found",
          code: "ROUTE_NOT_FOUND"
        }
      })
    };

    createErrorResponseMock.mockReturnValue(notFound);

    const result = await handler(event);

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"event":"request.failed"')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('"errorCode":"ROUTE_NOT_FOUND"')
    );
    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
  });

  it("logs incoming request metadata", async () => {
    const { handler, createPaymentMock } = loadHandler();
    const event = createEvent(ROUTES.CREATE_PAYMENT.routeKey);

    createPaymentMock.mockResolvedValue({ statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2);

    await handler(event);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"request.received"')
    );

    expect(JSON.parse((console.info as jest.Mock).mock.calls[0][0] as string)).toEqual(
      expect.objectContaining({
        service: "payment-service",
        routeKey: ROUTES.CREATE_PAYMENT.routeKey,
        requestId: "req-1",
        method: "POST"
      })
    );
  });
});

