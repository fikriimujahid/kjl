import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { ProductNotFoundError } from "../../src/errors/applicationErrors";
import { getProductDetailsHandler } from "../../src/handlers/getProductDetailsHandler";
import { ProductDetail } from "../../src/types/productTypes";
import { getProductDetails } from "../../src/use-cases/getProductDetails";

jest.mock("../../src/use-cases/getProductDetails", () => ({
  getProductDetails: jest.fn()
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
  const getProductDetailsMock = getProductDetails as jest.MockedFunction<typeof getProductDetails>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when product id is missing", async () => {
    const event = createEvent();

    const result = await getProductDetailsHandler(event);

    expect(getProductDetailsMock).not.toHaveBeenCalled();
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

    getProductDetailsMock.mockRejectedValue(new ProductNotFoundError());

    const result = await getProductDetailsHandler(event);

    expect(getProductDetailsMock).toHaveBeenCalledWith("prod-1");
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
    const productDetail: ProductDetail = {
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

    getProductDetailsMock.mockResolvedValue(productDetail);

    const result = await getProductDetailsHandler(event);

    expect(getProductDetailsMock).toHaveBeenCalledWith("prod-1");
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, productDetail);
    expect(result).toEqual({
      statusCode: 200,
      data: productDetail,
      kind: "success"
    });
  });

  it("returns 502 when service throws", async () => {
    const event = createEvent("prod-1");

    getProductDetailsMock.mockRejectedValue(new Error("upstream unavailable"));

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
