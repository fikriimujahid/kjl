import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getProductsHandler } from "../../src/handlers/getProductsHandler";
import { getProducts } from "../../src/services/productService";

jest.mock("../../src/services/productService", () => ({
  getProducts: jest.fn()
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

const createEvent = (): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/products",
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("getProductsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 with products when service succeeds", async () => {
    const event = createEvent();
    const products = [
      {
        id: "prod-1",
        name: "JLPT N5",
        price: 100000,
        shortDescription: "N5 package",
        level: "N5",
        topicsCount: 10,
        accessDurationDays: 30
      }
    ];

    (getProducts as jest.Mock).mockResolvedValue(products);

    const result = await getProductsHandler(event);

    expect(getProducts).toHaveBeenCalledTimes(1);
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, products);
    expect(result).toEqual({
      statusCode: 200,
      data: products,
      kind: "success"
    });
  });

  it("returns 502 when service throws", async () => {
    const event = createEvent();

    (getProducts as jest.Mock).mockRejectedValue(new Error("dynamodb down"));

    const result = await getProductsHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 502, "Failed to load product data", {
      code: "PRODUCTS_FETCH_FAILED"
    });
    expect(result).toEqual({
      statusCode: 502,
      message: "Failed to load product data",
      meta: {
        code: "PRODUCTS_FETCH_FAILED"
      },
      kind: "error"
    });
  });
});
