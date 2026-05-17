import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse } from "@shared-utils/response";
import { handler } from "../src/handler";
import { getProductDetailsHandler } from "../src/handlers/getProductDetailsHandler";
import { getProductExistsInternalHandler } from "../src/handlers/getProductSummaryInternalHandler";
import { getOwnedProductsInternalHandler } from "../src/handlers/getOwnedProductsInternalHandler";
import { getOwnedProductsHandler } from "../src/handlers/getOwnedProductsHandler";
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

jest.mock("../src/handlers/getOwnedProductsHandler", () => ({
  getOwnedProductsHandler: jest.fn(),
}));

jest.mock("../src/handlers/getOwnedProductsInternalHandler", () => ({
  getOwnedProductsInternalHandler: jest.fn(),
}));

jest.mock("../src/handlers/getProductExistsInternalHandler", () => ({
  getProductExistsInternalHandler: jest.fn(),
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
}));

describe("product-service handler routing", () => {
  const getProductsMock = getProductsHandler as jest.MockedFunction<typeof getProductsHandler>;
  const getProductDetailsMock = getProductDetailsHandler as jest.MockedFunction<typeof getProductDetailsHandler>;
  const getOwnedProductsMock = getOwnedProductsHandler as jest.MockedFunction<typeof getOwnedProductsHandler>;
  const getOwnedProductsInternalMock = getOwnedProductsInternalHandler as jest.MockedFunction<typeof getOwnedProductsInternalHandler>;
  const getProductExistsInternalMock = getProductExistsInternalHandler as jest.MockedFunction<typeof getProductExistsInternalHandler>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;
  const logRequestReceivedMock = logRequestReceived as jest.MockedFunction<typeof logRequestReceived>;
  const logRequestResultMock = logRequestResult as jest.MockedFunction<typeof logRequestResult>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function createEvent(routeKey: string, id?: string): APIGatewayProxyEventV2 {
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
      pathParameters: id ? { id } : undefined,
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
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
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
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
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

  it("routes GET /api/products/owned/{userId} to getOwnedProducts", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify([{ id: "purchase-1" }]),
    };
    getOwnedProductsMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_OWNED_PRODUCTS.routeKey, "user-1");
    const result = await handler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledTimes(1);
    expect(getOwnedProductsMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_OWNED_PRODUCTS.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_OWNED_PRODUCTS.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("routes GET /api/internal/products/owned/{userId} to getOwnedProductsInternal", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify([{ id: "purchase-1" }]),
    };
    getOwnedProductsInternalMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey, "user-1");
    const result = await handler(event);

    expect(getOwnedProductsInternalMock).toHaveBeenCalledTimes(1);
    expect(getOwnedProductsInternalMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(getProductExistsInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey, requestId: "req-123" }),
      response
    );
  });

  it("routes GET /api/internal/products/{id}/exists to getProductExistsInternal", async () => {
    const response: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify(true),
    };
    getProductExistsInternalMock.mockResolvedValue(response);

    const event = createEvent(ROUTES.GET_INTERNAL_PRODUCT_EXISTS.routeKey, "prod-1");
    const result = await handler(event);

    expect(getProductExistsInternalMock).toHaveBeenCalledTimes(1);
    expect(getProductExistsInternalMock).toHaveBeenCalledWith(event);
    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
    expect(logRequestReceivedMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        routeKey: ROUTES.GET_INTERNAL_PRODUCT_EXISTS.routeKey,
        requestId: "req-123",
        method: "GET"
      })
    );
    expect(logRequestResultMock).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({ routeKey: ROUTES.GET_INTERNAL_PRODUCT_EXISTS.routeKey, requestId: "req-123" }),
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
    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(getProductExistsInternalMock).not.toHaveBeenCalled();
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
    [ROUTES.GET_OWNED_PRODUCTS.routeKey],
    [ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey],
    [ROUTES.GET_INTERNAL_PRODUCT_EXISTS.routeKey]
  ])("logs request lifecycle metadata for route %s", async (routeKey) => {
    const defaultResponse: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

    getProductsMock.mockResolvedValue(defaultResponse);
    getProductDetailsMock.mockResolvedValue(defaultResponse);
    getOwnedProductsMock.mockResolvedValue(defaultResponse);
    getOwnedProductsInternalMock.mockResolvedValue(defaultResponse);
    getProductExistsInternalMock.mockResolvedValue(defaultResponse);

    const pathParameter =
      routeKey === ROUTES.GET_PRODUCTS.routeKey
        ? undefined
        : routeKey === ROUTES.GET_PRODUCT_DETAIL.routeKey
          ? "prod-1"
          : routeKey === ROUTES.GET_INTERNAL_PRODUCT_EXISTS.routeKey
            ? "prod-1"
          : "user-1";
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
