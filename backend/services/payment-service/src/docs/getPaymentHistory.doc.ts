import { commonErrorResponses, createErrorResponse } from "@shared-swagger/errors";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createOkResponse } from "@shared-swagger/responses";
import { ROUTES } from "../routes";
import { paymentHistoryResponseSchema } from "./schemas";

export const getPaymentHistoryDocPath = ROUTES.GET_PAYMENT_HISTORY.path;

export const getPaymentHistoryDocPathItem: OpenApiPathItem = {
  get: {
    summary: "Get authenticated user payment history",
    tags: ["Payment"],
    security: [{ bearerAuth: [] }],
    responses: {
      "200": createOkResponse(paymentHistoryResponseSchema),
      ...commonErrorResponses,
      "502": createErrorResponse("Bad Gateway")
    }
  }
};
