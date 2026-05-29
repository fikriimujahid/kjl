import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse } from "@shared-utils/response";
import { handler } from "../src/handler";
import { getProductDetailsHandler } from "../src/handlers/getProductDetailsHandler";
import { getSessionByIdInternalHandler } from "../src/handlers/getSessionByIdInternalHandler";
import { getProductSummaryInternalHandler } from "../src/handlers/getProductSummaryInternalHandler";
import { getProductsHandler } from "../src/handlers/getProductsHandler";
import { ROUTES } from "../src/routes";

jest.mock("../src/config/env", () => ({
  getProductServiceEnv: jest.fn(() => ({
    DYNAMO_DB_TABLE_NAME: "test-table",
    MEDIA_PRIVATE_BUCKET_NAME: "test-bucket",
    INTERNAL_SERVICE_API_KEY: "internal-test-key"
  }))
}));

jest.mock("@shared-utils/logger", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }))
}));

jest.mock("@shared-utils/requestLifecycle", () => ({
  logRequestReceived: jest.fn(),
  logRequestResult: jest.fn((_: unknown, __: unknown, response: unknown) => response)
}));

jest.mock("../src/handlers/getProductsHandler", () => ({
  getProductsHandler: jest.fn(),
}));

jest.mock("../src/handlers/getProductDetailsHandler", () => ({
  getProductDetailsHandler: jest.fn(),
}));

jest.mock("../src/handlers/getProductSummaryInternalHandler", () => ({
  getProductSummaryInternalHandler: jest.fn(),
}));

jest.mock("../src/handlers/getSessionByIdInternalHandler", () => ({
  getSessionByIdInternalHandler: jest.fn(),
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
}));

describe("product-service handler routing", () => {
  const getProductsMock = getProductsHandler as jest.MockedFunction<typeof getProductsHandler>;
  const getProductDetailsMock = getProductDetailsHandler as jest.MockedFunction<typeof getProductDetailsHandler>;
  const getProductSummaryInternalMock = getProductSummaryInternalHandler as jest.MockedFunction<typeof getProductSummaryInternalHandler>;
  const getSessionByIdInternalMock = getSessionByIdInternalHandler as jest.MockedFunction<typeof getSessionByIdInternalHandler>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;
  const logRequestReceivedMock = logRequestReceived as jest.MockedFunction<typeof logRequestReceived>;
  const logRequestResultMock = logRequestResult as jest.MockedFunction<typeof logRequestResult>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createEvent(routeKey: string, id?: string): APIGatewayProxyEventV2 {
    const defaultPathParameters =
      routeKey === ROUTES.GET_INTERNAL_SESSION_BY_ID.routeKey
        ? {
            productId: id ?? "prod-1",
            topicId: "topic-1",
            sessionId: "session-1"
          }
        : id
          ? { id }
          : undefined;

    return {
      routeKey,
      requestContext: {
        accountId: "test-account",
        apiId: "test-api",
        domainName: "localhost",
        domainPrefix: "localhost",
        http: {
          method: "GET",
          path: "/",
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "jest",
        },
        requestId: "req-123",
        routeKey,
        stage: "$default",
        time: "09/May/2026:00:00:00 +0000",
        timeEpoch: 1,
      },
      rawPath: id ? `/api/products/${id}` : "/api/products",
      rawQueryString: "",
      headers: {},
      isBase64Encoded: false,
      version: "2.0",
      pathParameters: defaultPathParameters,
    } as APIGatewayProxyEventV2;
  }

  it("routes GET /api/products to getProducts", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
    getProductsMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_PRODUCTS.routeKey);
    const result = await handler(event);

    expect(getProductsMock).toHaveBeenCalledTimes(1);
    expect(getProductsMock).toHaveBeenCalledWith(event);
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_PRODUCTS.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_PRODUCTS.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("routes GET /api/products/{id} to getProductDetails", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ id: "prod-1" }),
    };
    getProductDetailsMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_PRODUCT_DETAIL.routeKey, "prod-1");
    const result = await handler(event);

    expect(getProductDetailsMock).toHaveBeenCalledTimes(1);
    expect(getProductDetailsMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_PRODUCT_DETAIL.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_PRODUCT_DETAIL.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("routes GET /api/internal/products/{id}/summary to getProductSummaryInternal", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify(true),
    };
    getProductSummaryInternalMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.routeKey, "prod-1");
    const result = await handler(event);

    expect(getProductSummaryInternalMock).toHaveBeenCalledTimes(1);
    expect(getProductSummaryInternalMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getSessionByIdInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("routes GET /api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId} to getSessionByIdInternal", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ id: "session-1" }),
    };
    getSessionByIdInternalMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_INTERNAL_SESSION_BY_ID.routeKey, "prod-1");
    const result = await handler(event);

    expect(getSessionByIdInternalMock).toHaveBeenCalledTimes(1);
    expect(getSessionByIdInternalMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getProductSummaryInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_INTERNAL_SESSION_BY_ID.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_INTERNAL_SESSION_BY_ID.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("returns 404 for unsupported routeKey", async () => {
    const event = createEvent("GET /api/unknown");
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

    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getProductSummaryInternalMock).not.toHaveBeenCalled();
    expect(getSessionByIdInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: "GET /api/unknown", requestId: "req-123" }),
      notFound
    );
  });

  it.each([
    [ROUTES.GET_PRODUCTS.routeKey],
    [ROUTES.GET_PRODUCT_DETAIL.routeKey],
    [ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.routeKey],
    [ROUTES.GET_INTERNAL_SESSION_BY_ID.routeKey]
  ])("logs request lifecycle metadata for route %s", async (routeKey) => {
    const defaultResponse: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

    getProductsMock.mockResolvedValue(defaultResponse);
    getProductDetailsMock.mockResolvedValue(defaultResponse);
    getProductSummaryInternalMock.mockResolvedValue(defaultResponse);
    getSessionByIdInternalMock.mockResolvedValue(defaultResponse);

    const pathParameter =
      routeKey === ROUTES.GET_PRODUCTS.routeKey
        ? undefined
        : routeKey === ROUTES.GET_PRODUCT_DETAIL.routeKey
          ? "prod-1"
          : "prod-1";
    const event = createEvent(routeKey, pathParameter);

    await handler(event);

    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey, requestId: "req-123", method: "GET" })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey, requestId: "req-123", method: "GET" }),
      defaultResponse
    );
  });

});
