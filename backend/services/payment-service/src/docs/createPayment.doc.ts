import { commonErrorResponses, createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { createPaymentRequestSchema, createPaymentResponseSchema } from "./schemas";

export const createPaymentDocPath = ROUTES.CREATE_PAYMENT.path;

export const createPaymentDocPathItem: OpenApiPathItem = {
  post: {
    summary: "Create payment transaction",
    tags: ["Payment"],
    security: [{ bearerAuth: [] }],
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: createPaymentRequestSchema
        }
      }
    },
    responses: {
      "200": createOkResponse(createPaymentResponseSchema),
      ...commonErrorResponses,
      "502": createErrorResponse("Bad Gateway")
    }
  }
};