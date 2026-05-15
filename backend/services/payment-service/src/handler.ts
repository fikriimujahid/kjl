import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createPayment } from "./handlers/createPayment";
import { handleWebhook } from "./handlers/handleWebhook";
import { ROUTES } from "./routes";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("[INCOMING_REQUEST]", {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
    payload: event.body
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
