import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { getProductDetails } from "./handlers/getProductDetails";
import { getProducts } from "./handlers/getProducts";
import { jsonResponse } from "./utils/response";

export const handler = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
  if (event.routeKey === "GET /api/products") {
    return getProducts(event);
  }

  if (event.routeKey === "GET /api/products/{id}") {
    return getProductDetails(event);
  }

  return jsonResponse(404, { message: "Route not found" });
};

export const main = handler;
