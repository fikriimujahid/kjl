import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProducts } from "../services/productService";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";

export const getProductsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const products = await getProducts();
    return createSuccessResponse(event, 200, products);
  } catch {
    return createErrorResponse(event, 502, "Failed to load product data", {
      code: "PRODUCTS_FETCH_FAILED"
    });
  }
};
