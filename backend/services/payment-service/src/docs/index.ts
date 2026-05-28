import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { createPaymentDocPath, createPaymentDocPathItem } from "./createPayment.doc";
import { getOwnedProductsDocPath, getOwnedProductsDocPathItem } from "./getOwnedProducts.doc";
import {
  getOwnedProductsInternalDocPath,
  getOwnedProductsInternalDocPathItem
} from "./getOwnedProductsInternal.doc";
import { getPaymentHistoryDocPath, getPaymentHistoryDocPathItem } from "./getPaymentHistory.doc";
import { handleWebhookDocPath, handleWebhookDocPathItem } from "./handleWebhook.doc";

export const paymentServicePaths: Record<string, OpenApiPathItem> = {
  [createPaymentDocPath]: createPaymentDocPathItem,
  [getOwnedProductsDocPath]: getOwnedProductsDocPathItem,
  [getOwnedProductsInternalDocPath]: getOwnedProductsInternalDocPathItem,
  [getPaymentHistoryDocPath]: getPaymentHistoryDocPathItem,
  [handleWebhookDocPath]: handleWebhookDocPathItem
};

const paymentServiceLocalBaseUrl = "http://localhost:3002";

export const buildPaymentServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Payment Service API",
    version: "1.0.0",
    description: "Payment and ownership endpoints for KeJepangDulu",
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
    tags: [{ name: "Payment", description: "Payment creation, history, webhook, and ownership operations" }],
    paths: paymentServicePaths
  });
};

export const generatePaymentServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildPaymentServiceOpenApi());
};