import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createPaymentDocPath, createPaymentDocPathItem } from "./createPayment.doc";
import { getPaymentHistoryDocPath, getPaymentHistoryDocPathItem } from "./getPaymentHistory.doc";
import { handleWebhookDocPath, handleWebhookDocPathItem } from "./handleWebhook.doc";

export const paymentServicePaths: Record<string, OpenApiPathItem> = {
  [createPaymentDocPath]: createPaymentDocPathItem,
  [getPaymentHistoryDocPath]: getPaymentHistoryDocPathItem,
  [handleWebhookDocPath]: handleWebhookDocPathItem
};

const paymentServiceLocalBaseUrl = "http://localhost:3002";

export const buildPaymentServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Payment Service API",
    version: "1.0.0",
    description: "Payment endpoints for KeJepangDulu",
    servers: [
      {
        url: "{paymentServiceBaseUrl}",
        description: "Payment service base URL",
        variables: {
          paymentServiceBaseUrl: {
            default: paymentServiceLocalBaseUrl,
            description: "Payment service local base URL"
          }
        }
      }
    ],
    includeBearerAuth: true,
    tags: [{ name: "Payment", description: "Payment creation, history, and webhook operations" }],
    paths: paymentServicePaths
  });
};

export const generatePaymentServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildPaymentServiceOpenApi());
};