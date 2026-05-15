import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createPayment } from "./handlers/createPayment";
import { handleWebhook } from "./handlers/handleWebhook";
import { ROUTES } from "./routes";
import { createLogger } from "@shared-utils/logger";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";

const logger = createLogger("payment-service");

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  logger.info("request.received", {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
    method: event.requestContext.http.method
  });

  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse(event);
  }

  if (event.routeKey === ROUTES.CREATE_PAYMENT.routeKey) {
    return createPayment(event);
  }

  if (event.routeKey === ROUTES.HANDLE_WEBHOOK.routeKey) {
    return handleWebhook(event);
  }

  return createErrorResponse(event, 404, "Route not found", { code: "ROUTE_NOT_FOUND" });
};

export const main = handler;
