import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetailsHandler } from "./handlers/getProductDetailsHandler";
import { getOwnedProductsHandler } from "./handlers/getOwnedProductsHandler";
import { getProductsHandler } from "./handlers/getProductsHandler";
import { ROUTES } from "./routes";
import { createErrorResponse } from "@shared-utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("[INCOMING_REQUEST]", {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  switch (event.routeKey) {
    case ROUTES.GET_PRODUCTS.routeKey:
      return getProductsHandler(event);
    case ROUTES.GET_PRODUCT_DETAIL.routeKey:
      return getProductDetailsHandler(event);
    case ROUTES.GET_OWNED_PRODUCTS.routeKey:
      return getOwnedProductsHandler(event);
    default:
      return createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" });
  }
};

export const main = handler;
