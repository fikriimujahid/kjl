import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getProductDetails } from "../use-cases/getProductDetails";

export const getProductDetailsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const productId = event.pathParameters?.id;

  if (!productId) {
    return createErrorResponse(event, 400, "Missing product id", { code: "VALIDATION_ERROR" });
  }

  try {
    const productDetails = await getProductDetails(productId);
    return createSuccessResponse(event, 200, productDetails);
  } catch (error) {
    return mapProductErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load product data",
      code: "PRODUCT_DETAIL_FETCH_FAILED"
    });
  }
};
