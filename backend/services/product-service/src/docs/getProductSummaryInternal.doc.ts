import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { productSchema } from "./schemas";

export const getProductSummaryInternalDocPath = ROUTES.GET_INTERNAL_PRODUCT_SUMMARY.path;

export const getProductSummaryInternalDocPathItem: OpenApiPathItem = {
  get: {
    summary: "Get an internal product summary by id",
    tags: ["Product"],
    responses: {
      "200": createOkResponse(productSchema),
      "400": createErrorResponse("Bad Request"),
      "403": createErrorResponse("Forbidden"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};