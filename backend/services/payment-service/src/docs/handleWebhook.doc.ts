import { createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { webhookRequestSchema, webhookResponseSchema } from "./schemas";

export const handleWebhookDocPath = ROUTES.HANDLE_WEBHOOK.path;

export const handleWebhookDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Handle Midtrans payment webhook",
    tags: ["Payment"],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: webhookRequestSchema
        }
      }
    },
    responses: {
      "200": createOkResponse(webhookResponseSchema),
      "400": createErrorResponse("Bad Request"),
      "401": createErrorResponse("Unauthorized"),
      "404": createErrorResponse("Not Found"),
      "502": createErrorResponse("Bad Gateway")
    }
  }
};