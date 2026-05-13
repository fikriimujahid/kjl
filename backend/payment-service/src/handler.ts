import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createPayment } from "./handlers/createPayment";
import { handleWebhook } from "./handlers/handleWebhook";
import { ROUTES } from "./routes";
import { jsonResponse, optionsResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("[INCOMING_REQUEST]", {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse();
  }

  if (event.routeKey === ROUTES.CREATE_PAYMENT.routeKey) {
    return createPayment(event);
  }

  if (event.routeKey === ROUTES.HANDLE_WEBHOOK.routeKey) {
    return handleWebhook(event);
  }

  return jsonResponse(404, { message: "Route not found" });
};

export const main = handler;
