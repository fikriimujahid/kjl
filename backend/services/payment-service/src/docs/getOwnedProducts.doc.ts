import { withBearerAuth } from "@shared-swagger/auth";
import { commonErrorResponses, createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { ownedProductSchema } from "./schemas";

export const getOwnedProductsDocPath = ROUTES.GET_OWNED_PRODUCTS.path;

export const getOwnedProductsDocPathItem: OpenApiPathItem = {
  get: {
    summary: "List owned products for authenticated user",
    tags: ["Payment"],
    security: withBearerAuth(),
    responses: {
      "200": createOkResponse({
        type: "array",
        items: ownedProductSchema
      }),
      ...commonErrorResponses,
      "502": createErrorResponse("Bad Gateway")
    }
  }
};