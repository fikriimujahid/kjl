import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetails } from "./handlers/getProductDetails";
import { getProducts } from "./handlers/getProducts";
import { ROUTES } from "./routes";
import { jsonResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  console.log("[INCOMING_REQUEST]", {
    routeKey: event.routeKey,
    requestId: event.requestContext?.requestId,
  });

  switch (event.routeKey) {
    case ROUTES.GET_PRODUCTS.routeKey:
      return getProducts(event);
    case ROUTES.GET_PRODUCT_DETAIL.routeKey:
      return getProductDetails(event);
    default:
      return jsonResponse(404, { message: "Route not found" });
  }
};

export const main = handler;
