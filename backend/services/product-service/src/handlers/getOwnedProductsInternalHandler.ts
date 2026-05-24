import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getOwnedProductsSchema } from "../schemas/getOwnedProductsSchema";
import { getProductServiceEnv } from "../config/env";
import { getOwnedProductsInternal } from "../use-cases/getOwnedProductsInternal";

const INTERNAL_API_KEY_HEADER = "x-internal-api-key";

const getInternalApiKey = (event: APIGatewayProxyEventV2): string | undefined => {
  const headers = event.headers ?? {};

  return headers[INTERNAL_API_KEY_HEADER]
    ?? headers[INTERNAL_API_KEY_HEADER.toUpperCase()]
    ?? headers["X-Internal-Api-Key"];
};

export const getOwnedProductsInternalHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getOwnedProductsSchema.safeParseEvent(event);

  if (!parsedRequest.success) {
    return createErrorResponse(event, 400, parsedRequest.error, {
      code: parsedRequest.error === "Invalid JSON body" ? "INVALID_JSON" : "VALIDATION_ERROR"
    });
  }

  const expectedInternalApiKey = getProductServiceEnv().PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY;
  const incomingInternalApiKey = getInternalApiKey(event);

  if (!incomingInternalApiKey || incomingInternalApiKey !== expectedInternalApiKey) {
    return createErrorResponse(event, 403, "Forbidden", {
      code: "FORBIDDEN"
    });
  }

  try {
    const ownedProducts = await getOwnedProductsInternal({
      requestedUserId: parsedRequest.data.userId
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
