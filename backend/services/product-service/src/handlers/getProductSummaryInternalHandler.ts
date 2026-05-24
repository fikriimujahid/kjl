import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { mapProductErrorToResponse } from "../errors/errorToResponse";
import { getProductSummaryInternalSchema } from "../schemas/getProductSummaryInternalSchema";
import { getProductServiceEnv } from "../config/env";
import { getProductSummaryInternal } from "../use-cases/getProductSummaryInternal";

const INTERNAL_API_KEY_HEADER = "x-internal-api-key";

const getInternalApiKey = (event: APIGatewayProxyEventV2): string | undefined => {
  const headers = event.headers ?? {};

  return headers[INTERNAL_API_KEY_HEADER]
    ?? headers[INTERNAL_API_KEY_HEADER.toUpperCase()]
    ?? headers["X-Internal-Api-Key"];
};

export const getProductSummaryInternalHandler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const parsedRequest = getProductSummaryInternalSchema.safeParseEvent(event);

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
    const productSummary = await getProductSummaryInternal({
      productId: parsedRequest.data.productId
    });

    return createSuccessResponse(event, 200, productSummary);
  } catch (error) {
    return mapProductErrorToResponse(event, error, {
      statusCode: 502,
      message: "Failed to get product summary",
      code: "PRODUCT_SUMMARY_FETCH_FAILED"
    });
  }
};
