import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createLogger } from "@shared-utils/logger";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { getProductServiceEnv } from "./config/env";
import { getProductDetailsHandler } from "./handlers/getProductDetailsHandler";
import { getProductSummaryInternalHandler } from "./handlers/getProductSummaryInternalHandler";
import { getOwnedProductsInternalHandler } from "./handlers/getOwnedProductsInternalHandler";
import { getOwnedProductsHandler } from "./handlers/getOwnedProductsHandler";
import { getProductsHandler } from "./handlers/getProductsHandler";
import { ROUTES } from "./routes";

getProductServiceEnv();

const logger = createLogger("product-service");

const routeHandlers: Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
> = {
  [ROUTES.GET_PRODUCTS.routeKey]: getProductsHandler,
  [ROUTES.GET_PRODUCT_DETAIL.routeKey]: getProductDetailsHandler,
  [ROUTES.GET_OWNED_PRODUCTS.routeKey]: getOwnedProductsHandler,
  [ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey]: getOwnedProductsInternalHandler,
  [ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.routeKey]: getProductSummaryInternalHandler
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const requestContext = {
    requestId: event.requestContext?.requestId,
    routeKey: event.routeKey,
    method: event.requestContext.http.method
  };

  logRequestReceived(logger, requestContext);

  if (event.requestContext.http.method === "OPTIONS") {
    return logRequestResult(logger, requestContext, optionsResponse(event));
  }

  const routeHandler = routeHandlers[event.routeKey ?? ""];
  if (routeHandler) {
    return logRequestResult(logger, requestContext, await routeHandler(event));
  }

  return logRequestResult(
    logger,
    requestContext,
    createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" })
  );
};

export const main = handler;
