import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getProductDetailsSchema } from "../schemas/getProductDetailsSchema";
import { getProductDetails } from "../use-cases/getProductDetails";

export const getProductDetailsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getProductDetailsSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  try {
    const productDetails = await getProductDetails(parsedRequest.data.productId);
    return createSuccessResponse(event, 200, productDetails);
  } catch (error) {
    return mapProductErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load product data",
      code: "PRODUCT_DETAIL_FETCH_FAILED"
    });
  }
};
