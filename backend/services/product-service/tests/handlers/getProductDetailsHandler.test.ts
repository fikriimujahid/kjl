import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getProductDetailsHandler } from "../../src/handlers/getProductDetailsHandler";
import { getProductDetailsById } from "../../src/services/productService";

jest.mock("../../src/services/productService", () => ({
  getProductDetailsById: jest.fn()
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

const createEvent = (id?: string): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/products/{id}",
    pathParameters: id ? { id } : undefined,
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("getProductDetailsHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when product id is missing", async () => {
    const event = createEvent();

    const result = await getProductDetailsHandler(event);

    expect(getProductDetailsById).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing product id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing product id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 404 when service returns null", async () => {
    const event = createEvent("prod-1");

    (getProductDetailsById as jest.Mock).mockResolvedValue(null);

    const result = await getProductDetailsHandler(event);

    expect(getProductDetailsById).toHaveBeenCalledWith("prod-1");
    expect(createErrorResponse).toHaveBeenCalledWith(event, 404, "Product not found", {
      code: "PRODUCT_NOT_FOUND"
    });
    expect(result).toEqual({
      statusCode: 404,
      message: "Product not found",
      meta: {
        code: "PRODUCT_NOT_FOUND"
      },
      kind: "error"
    });
  });

  it("returns 200 with product detail when service succeeds", async () => {
    const event = createEvent("prod-1");
    const productDetail = {
      id: "prod-1",
      name: "JLPT N5",
      price: 100000,
      shortDescription: "N5 package",
      level: "N5",
      topicsCount: 10,
      accessDurationDays: 30,
      description: "Complete N5 preparation",
      topics: []
    };

    (getProductDetailsById as jest.Mock).mockResolvedValue(productDetail);

    const result = await getProductDetailsHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, productDetail);
    expect(result).toEqual({
      statusCode: 200,
      data: productDetail,
      kind: "success"
    });
  });

  it("returns 502 when service throws", async () => {
    const event = createEvent("prod-1");

    (getProductDetailsById as jest.Mock).mockRejectedValue(new Error("upstream unavailable"));

    const result = await getProductDetailsHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 502, "Failed to load product data", {
      code: "PRODUCT_DETAIL_FETCH_FAILED"
    });
    expect(result).toEqual({
      statusCode: 502,
      message: "Failed to load product data",
      meta: {
        code: "PRODUCT_DETAIL_FETCH_FAILED"
      },
      kind: "error"
    });
  });
});
