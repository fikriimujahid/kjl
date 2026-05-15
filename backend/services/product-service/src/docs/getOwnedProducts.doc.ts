import { withBearerAuth } from "@shared-swagger/auth";
import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ownedProductSchema } from "./schemas";

export const getOwnedProductsDocPath = "/api/products/owned/{userId}";

export const getOwnedProductsDocPathItem: OpenApiPathItem = {
  get: {
    summary: "List owned products for authenticated user",
    tags: ["Product"],
    security: withBearerAuth(),
    responses: {
      "200": createOkResponse({
        type: "array",
        items: ownedProductSchema
      }),
      "400": createErrorResponse("Bad Request"),
      "401": createErrorResponse("Unauthorized"),
      "403": createErrorResponse("Forbidden"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};
