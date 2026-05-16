import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getOwnedProducts } from "../use-cases/getOwnedProducts";

export const getOwnedProductsHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const userId = event.pathParameters?.userId;

  if (!userId) {
    return createErrorResponse(event, 400, "Missing user id", { code: "VALIDATION_ERROR" });
  }

  const authenticatedUser = getAuthenticatedUser(event);

  try {
    const ownedProducts = await getOwnedProducts({
      requestedUserId: userId,
      authenticatedUserId: authenticatedUser?.id
    });

    return createSuccessResponse(event, 200, ownedProducts);
  } catch (error) {
    return mapProductErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to load owned product data",
      code: "OWNED_PRODUCTS_FETCH_FAILED"
    });
  }
};
