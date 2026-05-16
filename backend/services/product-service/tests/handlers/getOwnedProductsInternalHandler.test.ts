import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getOwnedProductsInternalHandler } from "../../src/handlers/getOwnedProductsInternalHandler";
import { getOwnedProductsInternal } from "../../src/use-cases/getOwnedProductsInternal";
import { OwnedProduct } from "../../src/types/productTypes";

jest.mock("../../src/use-cases/getOwnedProductsInternal", () => ({
  getOwnedProductsInternal: jest.fn()
}));

jest.mock("../../src/config/env", () => ({
  getProductServiceEnv: jest.fn(() => ({
    DYNAMO_DB_TABLE_NAME: "test-table",
    MEDIA_PRIVATE_BUCKET_NAME: "test-bucket",
    INTERNAL_SERVICE_API_KEY: "internal-secret"
  }))
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn((_: unknown, statusCode: number, message: string, meta: unknown) => ({
    statusCode,
    message,
    meta,
    kind: "error"
  })),
  createSuccessResponse: jest.fn((_: unknown, statusCode: number, data: unknown) => ({
    statusCode,
    data,
    kind: "success"
  }))
}));

const createEvent = (
  userId?: string,
  internalApiKey?: string
): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/internal/products/owned/{userId}",
    pathParameters: userId ? { userId } : undefined,
    headers: internalApiKey
      ? {
          "x-internal-api-key": internalApiKey
        }
      : {},
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as unknown as APIGatewayProxyEventV2;

describe("getOwnedProductsInternalHandler", () => {
  const getOwnedProductsInternalMock = getOwnedProductsInternal as jest.MockedFunction<typeof getOwnedProductsInternal>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when userId path parameter is missing", async () => {
    const event = createEvent(undefined, "internal-secret");

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing user id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing user id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 403 when internal api key is missing", async () => {
    const event = createEvent("user-1");

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 403, "Forbidden", {
      code: "FORBIDDEN"
    });
    expect(result).toEqual({
      statusCode: 403,
      message: "Forbidden",
      meta: {
        code: "FORBIDDEN"
      },
      kind: "error"
    });
  });

  it("returns 403 when internal api key does not match", async () => {
    const event = createEvent("user-1", "invalid-key");

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 403, "Forbidden", {
      code: "FORBIDDEN"
    });
    expect(result).toEqual({
      statusCode: 403,
      message: "Forbidden",
      meta: {
        code: "FORBIDDEN"
      },
      kind: "error"
    });
  });

  it("returns 200 when key is valid", async () => {
    const event = createEvent("user-1", "internal-secret");
    const ownedProducts: OwnedProduct[] = [
      {
        id: "purchase-1",
        productId: "prod-1",
        userId: "user-1",
        level: "N5",
        name: "JLPT N5",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        expiryDate: "2026-12-31T00:00:00.000Z"
      }
    ];
    getOwnedProductsInternalMock.mockResolvedValue(ownedProducts);

    const result = await getOwnedProductsInternalHandler(event);

    expect(getOwnedProductsInternalMock).toHaveBeenCalledWith({
      requestedUserId: "user-1"
    });
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, ownedProducts);
    expect(result).toEqual({
      statusCode: 200,
      data: ownedProducts,
      kind: "success"
    });
  });

  it("returns 502 when owned products lookup fails", async () => {
    const event = createEvent("user-1", "internal-secret");
    getOwnedProductsInternalMock.mockRejectedValue(new Error("query failed"));

    const result = await getOwnedProductsInternalHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 502, "Failed to load owned product data", {
      code: "OWNED_PRODUCTS_FETCH_FAILED"
    });
    expect(result).toEqual({
      statusCode: 502,
      message: "Failed to load owned product data",
      meta: {
        code: "OWNED_PRODUCTS_FETCH_FAILED"
      },
      kind: "error"
    });
  });
});
