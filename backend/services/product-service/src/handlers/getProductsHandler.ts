import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getProducts } from "../use-cases/getProducts";

export const getProductsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const products = await getProducts();
    return createSuccessResponse(event, 200, products);
  } catch (error) {
    return mapProductErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load product data",
      code: "PRODUCTS_FETCH_FAILED"
    });
  }
};
