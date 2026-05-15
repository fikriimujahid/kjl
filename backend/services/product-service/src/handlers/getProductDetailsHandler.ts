import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetailsById } from "../services/productService";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";

export const getProductDetailsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return createErrorResponse(event, 400, "Missing product id", { code: "VALIDATION_ERROR" });
  }

  try {
    const productDetails = await getProductDetailsById(productId);

    if (!productDetails) {
      return createErrorResponse(event, 404, "Product not found", { code: "PRODUCT_NOT_FOUND" });
    }

    return createSuccessResponse(event, 200, productDetails);
  } catch {
    return createErrorResponse(event, 502, "Failed to load product data", {
      code: "PRODUCT_DETAIL_FETCH_FAILED"
    });
  }
};
