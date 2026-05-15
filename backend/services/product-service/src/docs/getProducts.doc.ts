import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { productSchema } from "./schemas";

export const getProductsDocPath = "/api/products";

export const getProductsDocPathItem: OpenApiPathItem = {
  get: {
    summary: "List available products",
    tags: ["Product"],
    responses: {
      "200": createOkResponse({
        type: "array",
        items: productSchema
      }),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};
