import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getOwnedProductsInternal } from "../src/use-cases/getOwnedProductsInternal";
import { getOwnedProductsInternalHandler } from "../src/handlers/getOwnedProductsInternalHandler";

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
  createSuccessResponse: jest.fn()
}));

jest.mock("../src/use-cases/getOwnedProductsInternal", () => ({
  getOwnedProductsInternal: jest.fn()
}));

const ORIGINAL_ENV = process.env;

const buildEvent = (
  userId: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEventV2 => ({
  version: "2.0",
  routeKey: "GET /api/internal/payments/owned/{userId}",
  rawPath: `/api/internal/payments/owned/${userId}`,
  rawQueryString: "",
  headers,
  pathParameters: { userId },
  requestContext: {
    accountId: "test-account",
    apiId: "test-api",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "GET",
      path: `/api/internal/payments/owned/${userId}`,
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "jest"
    },
    requestId: "req-owned-internal",
    routeKey: "GET /api/internal/payments/owned/{userId}",
    stage: "$default",
    time: "28/May/2026:00:00:00 +0000",
    timeEpoch: Date.now()
  },
  isBase64Encoded: false
}) as APIGatewayProxyEventV2;

describe("getOwnedProductsInternalHandler", () => {
  const getOwnedProductsInternalMock = getOwnedProductsInternal as jest.MockedFunction<typeof getOwnedProductsInternal>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;
  const createSuccessResponseMock = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://api.midtrans.test/snap",
      APP_BASE_URL: "",
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test",
      PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: "internal-secret"
    };

    const { clearEnvCache } = require("../src/config/env") as {
      clearEnvCache: () => void;
    };

    clearEnvCache();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns 403 when internal api key is missing", async () => {
    const event = buildEvent("user-1");
    const response = { statusCode: 403, body: "{}" };

    createErrorResponseMock.mockReturnValue(response);

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 403, "Forbidden", {
      code: "FORBIDDEN"
    });
    expect(result).toBe(response);
  });

  it("returns 200 when the internal api key is valid", async () => {
    const event = buildEvent("user-1", {
      "x-internal-api-key": "internal-secret"
    });
    const ownedProducts = [
      {
        id: "product-1",
        productId: "product-1",
        userId: "user-1",
        level: "N5",
        name: "Starter Pack",
        purchaseDate: "2026-05-01T00:00:00.000Z",
        expiryDate: "2026-06-01T00:00:00.000Z"
      }
    ];
    const response = { statusCode: 200, body: "{}" };

    getOwnedProductsInternalMock.mockResolvedValue(ownedProducts);
    createSuccessResponseMock.mockReturnValue(response);

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).toHaveBeenCalledWith({
      requestedUserId: "user-1"
    });
    expect(createSuccessResponseMock).toHaveBeenCalledWith(event, 200, ownedProducts);
    expect(result).toBe(response);
  });
});