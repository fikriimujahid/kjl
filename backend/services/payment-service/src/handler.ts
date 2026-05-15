import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createPayment } from "./handlers/createPayment";
import { handleWebhook } from "./handlers/handleWebhook";
import { ROUTES } from "./routes";
import { createLogger } from "@shared-utils/logger";
import { logRequestReceived, logRequestResult } from "@shared-utils/requestLifecycle";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";

const logger = createLogger("payment-service");

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

  if (event.routeKey === ROUTES.CREATE_PAYMENT.routeKey) {
    return logRequestResult(logger, requestContext, await createPayment(event));
  }

  if (event.routeKey === ROUTES.HANDLE_WEBHOOK.routeKey) {
    return logRequestResult(logger, requestContext, await handleWebhook(event));
  }

  return logRequestResult(
    logger,
    requestContext,
    createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" })
  );
};

export const main = handler;
