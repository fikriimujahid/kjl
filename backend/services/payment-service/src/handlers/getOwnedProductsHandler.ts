import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapPaymentErrorToResponse } from "../errors/errorToResponse";
import { getOwnedProductsSchema } from "../schemas/getOwnedProductsSchema";
import { getOwnedProducts } from "../use-cases/getOwnedProducts";

export const getOwnedProductsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getOwnedProductsSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const ownedProducts = await getOwnedProducts({
      requestedUserId: parsedRequest.data.userId,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, ownedProducts);
  } catch (error) {
    return mapPaymentErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load owned product data",
      code: "OWNED_PRODUCTS_FETCH_FAILED"
    });
  }
};