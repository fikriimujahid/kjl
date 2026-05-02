import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createPayment } from "./handlers/createPayment";
import { handleWebhook } from "./handlers/handleWebhook";
import { jsonResponse, optionsResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.requestContext.http.method === "OPTIONS") {
    return optionsResponse();
  }

  if (event.routeKey === "POST /api/payments/create") {
    return createPayment(event);
  }

  if (event.routeKey === "POST /api/payments/webhook") {
    return handleWebhook(event);
  }

  return jsonResponse(404, { message: "Route not found" });
};

export const main = handler;
