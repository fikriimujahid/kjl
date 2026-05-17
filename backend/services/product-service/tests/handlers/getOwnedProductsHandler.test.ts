import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  AuthenticationRequiredError,
  ForbiddenProductAccessError
} from "../../src/errors/applicationErrors";
import { getOwnedProductsHandler } from "../../src/handlers/getOwnedProductsHandler";
import { getOwnedProducts } from "../../src/use-cases/getOwnedProducts";
import { OwnedProduct } from "../../src/types/productTypes";

jest.mock("../../src/use-cases/getOwnedProducts", () => ({
  getOwnedProducts: jest.fn()
}));

jest.mock("@shared-utils/auth", () => ({
  getAuthenticatedUser: jest.fn()
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
  claims?: Record<string, string>
): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/products/owned/{userId}",
    pathParameters: userId ? { userId } : undefined,
    requestContext: {
      http: {
        method: "GET"
      },
      authorizer: claims
        ? {
            jwt: {
              claims
            }
          }
        : undefined
    }
  }) as unknown as APIGatewayProxyEventV2;

describe("getOwnedProductsHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const getOwnedProductsMock = getOwnedProducts as jest.MockedFunction<typeof getOwnedProducts>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when userId path parameter is missing", async () => {
    const event = createEvent();

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).not.toHaveBeenCalled();
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

  it("returns 401 when authenticated user cannot be resolved", async () => {
    const event = createEvent("user-1");
    getAuthenticatedUserMock.mockReturnValue(null);
    getOwnedProductsMock.mockRejectedValue(new AuthenticationRequiredError());

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledWith({
      requestedUserId: "user-1",
      authenticatedUserId: undefined
    });
    expect(createErrorResponse).toHaveBeenCalledWith(event, 401, "Unauthorized", {
      code: "UNAUTHORIZED"
    });
    expect(result).toEqual({
      statusCode: 401,
      message: "Unauthorized",
      meta: {
        code: "UNAUTHORIZED"
      },
      kind: "error"
    });
  });

  it("returns 403 when authenticated user does not match requested user", async () => {
    const event = createEvent("user-1", { sub: "user-2" });
    getAuthenticatedUserMock.mockReturnValue({
      id: "user-2",
      email: "",
      name: ""
    });
    getOwnedProductsMock.mockRejectedValue(new ForbiddenProductAccessError());

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledWith({
      requestedUserId: "user-1",
      authenticatedUserId: "user-2"
    });
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

  it("accepts cognito:username fallback claim when sub is missing", async () => {
    const event = createEvent("user-1", { "cognito:username": "user-1" });
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

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    getOwnedProductsMock.mockResolvedValue(ownedProducts);

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledWith({
      requestedUserId: "user-1",
      authenticatedUserId: "user-1"
    });
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, ownedProducts);
    expect(result).toEqual({
      statusCode: 200,
      data: ownedProducts,
      kind: "success"
    });
  });

  it("returns 200 for matching sub claim and service payload", async () => {
    const event = createEvent("user-1", { sub: "user-1" });
    const ownedProducts: OwnedProduct[] = [];

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    getOwnedProductsMock.mockResolvedValue(ownedProducts);

    const result = await getOwnedProductsHandler(event);

    expect(getOwnedProductsMock).toHaveBeenCalledWith({
      requestedUserId: "user-1",
      authenticatedUserId: "user-1"
    });
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, ownedProducts);
    expect(result).toEqual({
      statusCode: 200,
      data: ownedProducts,
      kind: "success"
    });
  });

  it("returns 502 when owned product lookup fails", async () => {
    const event = createEvent("user-1", { sub: "user-1" });
    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });

    getOwnedProductsMock.mockRejectedValue(new Error("query failed"));

    const result = await getOwnedProductsHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(
      event,
      502,
      "Failed to load owned product data",
      {
        code: "OWNED_PRODUCTS_FETCH_FAILED"
      }
    );
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
