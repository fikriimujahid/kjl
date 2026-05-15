import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse } from "@shared-utils/response";
import { handler } from "../src/handler";
import { getProductDetailsHandler } from "../src/handlers/getProductDetailsHandler";
import { getOwnedProductsHandler } from "../src/handlers/getOwnedProductsHandler";
import { getProductsHandler } from "../src/handlers/getProductsHandler";
import { ROUTES } from "../src/routes";

jest.mock("../src/handlers/getProductsHandler", () => ({
  getProductsHandler: jest.fn(),
}));

jest.mock("../src/handlers/getProductDetailsHandler", () => ({
  getProductDetailsHandler: jest.fn(),
}));

jest.mock("../src/handlers/getOwnedProductsHandler", () => ({
  getOwnedProductsHandler: jest.fn(),
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
}));

describe("product-service handler routing", () => {
  const getProductsMock = getProductsHandler as jest.MockedFunction<typeof getProductsHandler>;
  const getProductDetailsMock = getProductDetailsHandler as jest.MockedFunction<typeof getProductDetailsHandler>;
  const getOwnedProductsMock = getOwnedProductsHandler as jest.MockedFunction<typeof getOwnedProductsHandler>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    expect(console.log).toHaveBeenCalledWith(
      "[INCOMING_REQUEST]",
      expect.objectContaining({ routeKey: ROUTES.GET_PRODUCTS.routeKey, requestId: "req-123" })
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
    expect(console.log).toHaveBeenCalledWith(
      "[INCOMING_REQUEST]",
      expect.objectContaining({ routeKey: ROUTES.GET_PRODUCT_DETAIL.routeKey, requestId: "req-123" })
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
    expect(result).toBe(response);
    expect(console.log).toHaveBeenCalledWith(
      "[INCOMING_REQUEST]",
      expect.objectContaining({ routeKey: ROUTES.GET_OWNED_PRODUCTS.routeKey, requestId: "req-123" })
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
    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
  });

  it.each([
    [ROUTES.GET_PRODUCTS.routeKey],
    [ROUTES.GET_PRODUCT_DETAIL.routeKey],
    [ROUTES.GET_OWNED_PRODUCTS.routeKey],
  ])("logs incoming request metadata for route %s", async (routeKey) => {
    const defaultResponse: APIGatewayProxyStructuredResultV2 = {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

    getProductsMock.mockResolvedValue(defaultResponse);
    getProductDetailsMock.mockResolvedValue(defaultResponse);
    getOwnedProductsMock.mockResolvedValue(defaultResponse);

    const pathParameter =
      routeKey === ROUTES.GET_PRODUCTS.routeKey
        ? undefined
        : routeKey === ROUTES.GET_PRODUCT_DETAIL.routeKey
          ? "prod-1"
          : "user-1";
    const event = createEvent(routeKey, pathParameter);

    await handler(event);

    expect(console.log).toHaveBeenCalledWith(
      "[INCOMING_REQUEST]",
      expect.objectContaining({ routeKey, requestId: "req-123" })
    );
  });
});
