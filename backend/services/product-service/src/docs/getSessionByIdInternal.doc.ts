import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { sessionRecordSchema } from "./schemas";

export const getSessionByIdInternalDocPath = ROUTES.GET_INTERNAL_SESSION_BY_ID.path;

export const getSessionByIdInternalDocPathItem: OpenApiPathItem = {
  get: {
    summary: "Get an internal session record by product, topic, and session id",
    tags: ["Product"],
    responses: {
      "200": createOkResponse({
        oneOf: [sessionRecordSchema, { type: "null" }]
      }),
      "400": createErrorResponse("Bad Request"),
      "403": createErrorResponse("Forbidden"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};