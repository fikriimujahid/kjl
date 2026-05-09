import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { handler } from "../src/handler";
import { getProductDetails } from "../src/handlers/getProductDetails";
import { getProducts } from "../src/handlers/getProducts";
import { ROUTES } from "../src/routes";

jest.mock("../src/handlers/getProducts", () => ({
  getProducts: jest.fn(),
}));

jest.mock("../src/handlers/getProductDetails", () => ({
  getProductDetails: jest.fn(),
}));

describe("product-service handler routing", () => {
  const getProductsMock = getProducts as jest.MockedFunction<typeof getProducts>;
  const getProductDetailsMock = getProductDetails as jest.MockedFunction<typeof getProductDetails>;

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
    expect(result).toBe(response);
    expect(console.log).toHaveBeenCalledWith(
      "[INCOMING_REQUEST]",
      expect.objectContaining({ routeKey: ROUTES.GET_PRODUCT_DETAIL.routeKey, requestId: "req-123" })
    );
  });

  it("returns 404 for unsupported routeKey", async () => {
    const event = createEvent("GET /api/unknown");
    const result = await handler(event);

    expect(getProductsMock).not.toHaveBeenCalled();
    expect(getProductDetailsMock).not.toHaveBeenCalled();
    expect(result.statusCode).toBe(404);
    expect(result.body).toBe(JSON.stringify({ message: "Route not found" }));
  });
});
