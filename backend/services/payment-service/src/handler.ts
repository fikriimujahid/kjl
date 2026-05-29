import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createLogger } from "@shared-utils/logger";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { getPaymentServiceEnv } from "./config/env";
import { createPaymentHandler } from "./handlers/createPaymentHandler";
import { getOwnedProductsHandler } from "./handlers/getOwnedProductsHandler";
import { getOwnedProductsInternalHandler } from "./handlers/getOwnedProductsInternalHandler";
import { getPaymentHistoryHandler } from "./handlers/getPaymentHistoryHandler";
import { handleWebhookHandler } from "./handlers/handleWebhookHandler";
import { ROUTES } from "./routes";

getPaymentServiceEnv();

const logger = createLogger("payment-service");

const routeHandlers: Record<
  string,
  (event: APIGatewayProxyEventV2) => Promise<APIGatewayProxyStructuredResultV2>
> = {
  [ROUTES.CREATE_PAYMENT.routeKey]: createPaymentHandler,
  [ROUTES.GET_OWNED_PRODUCTS.routeKey]: getOwnedProductsHandler,
  [ROUTES.GET_INTERNAL_OWNED_PRODUCTS.routeKey]: getOwnedProductsInternalHandler,
  [ROUTES.GET_PAYMENT_HISTORY.routeKey]: getPaymentHistoryHandler,
  [ROUTES.HANDLE_WEBHOOK.routeKey]: handleWebhookHandler
};

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  const requestContext = {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
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
