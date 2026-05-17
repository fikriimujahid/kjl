import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ownedProductSchema } from "./schemas";

export const getOwnedProductsInternalDocPath = "/api/internal/products/owned/{userId}";

export const getOwnedProductsInternalDocPathItem: OpenApiPathItem = {
  get: {
    summary: "List owned products for an internal trusted service",
    tags: ["Product"],
    responses: {
      "200": createOkResponse({
        type: "array",
        items: ownedProductSchema
      }),
      "400": createErrorResponse("Bad Request"),
      "403": createErrorResponse("Forbidden"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};
