import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { productDetailSchema } from "./schemas";

export const getProductDetailDocPath = "/api/products/{id}";

export const getProductDetailDocPathItem: OpenApiPathItem = {
  get: {
    summary: "Get product details by product id",
    tags: ["Product"],
    responses: {
      "200": createOkResponse(productDetailSchema),
      "400": createErrorResponse("Bad Request"),
      "404": createErrorResponse("Not Found"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};
