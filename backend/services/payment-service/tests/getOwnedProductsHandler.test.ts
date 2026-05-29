import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getOwnedProducts } from "../src/use-cases/getOwnedProducts";
import { getOwnedProductsHandler } from "../src/handlers/getOwnedProductsHandler";

jest.mock("@shared-utils/auth", () => ({
  getAuthenticatedUser: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
  createSuccessResponse: jest.fn()
}));

jest.mock("../src/use-cases/getOwnedProducts", () => ({
  getOwnedProducts: jest.fn()
}));

const { getAuthenticatedUser } = require("@shared-utils/auth") as {
  getAuthenticatedUser: jest.Mock;
};

const buildEvent = (
  userId: string,
  headers: Record<string, string> = {}
): APIGatewayProxyEventV2 => ({
  version: "2.0",
  routeKey: "GET /api/payments/owned/{userId}",
  rawPath: `/api/payments/owned/${userId}`,
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
      path: `/api/payments/owned/${userId}`,
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "jest"
    },
    requestId: "req-owned",
    routeKey: "GET /api/payments/owned/{userId}",
    stage: "$default",
    time: "28/May/2026:00:00:00 +0000",
    timeEpoch: Date.now()
  },
  isBase64Encoded: false
}) as APIGatewayProxyEventV2;

describe("getOwnedProductsHandler", () => {
  const getOwnedProductsMock = getOwnedProducts as jest.MockedFunction<typeof getOwnedProducts>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;
  const createSuccessResponseMock = createSuccessResponse as jest.MockedFunction<typeof createSuccessResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when user id is missing", async () => {
    const event = buildEvent("");
    const response = { statusCode: 400, body: "{}" };

    createErrorResponseMock.mockReturnValue(response);

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).not.toHaveBeenCalled();
    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 400, "Missing user id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toBe(response);
  });

  it("returns 200 with owned products for the authenticated user", async () => {
    const event = buildEvent("user-1");
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

    getAuthenticatedUser.mockReturnValue({ id: "user-1" });
    getOwnedProductsMock.mockResolvedValue(ownedProducts);
    createSuccessResponseMock.mockReturnValue(response);

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledWith({
      requestedUserId: "user-1",
      authenticatedUserId: "user-1"
    });
    expect(createSuccessResponseMock).toHaveBeenCalledWith(event, 200, ownedProducts);
    expect(result).toBe(response);
  });
});