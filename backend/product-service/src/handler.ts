import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetails } from "./handlers/getProductDetails";
// import { getProductSessionDetailsHandler } from "./handlers/getProductSessionDetails";
// import { getPurchasedProductDetails } from "./handlers/getPurchasedProductDetails";
// import { getPurchasedProducts } from "./handlers/getPurchasedProducts";
import { getProducts } from "./handlers/getProducts";
import { jsonResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.routeKey === "GET /api/products") {
    return getProducts(event);
  }

  if (event.routeKey === "GET /api/product/{id}") {
    return getProductDetails(event);
  }

  // if (event.routeKey === "GET /api/products/{productId}/topics/{topicId}/sessions/{sessionId}") {
  //   return getProductSessionDetailsHandler(event);
  // }

  // if (event.routeKey === "GET /api/purchased-products/{userId}") {
  //   return getPurchasedProducts(event);
  // }

  // if (event.routeKey === "GET /api/purchased-product/{userId}/product/{productId}") {
  //   return getPurchasedProductDetails(event);
  // }

  return jsonResponse(404, { message: "Route not found" });
};

export const main = handler;
