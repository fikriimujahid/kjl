import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { getProductDetailDocPath, getProductDetailDocPathItem } from "./getProductDetail.doc";
import { getProductsDocPath, getProductsDocPathItem } from "./getProducts.doc";

export const productServicePaths: Record<string, OpenApiPathItem> = {
  [getProductsDocPath]: getProductsDocPathItem,
  [getProductDetailDocPath]: getProductDetailDocPathItem
};

const productServiceLocalBaseUrl = "http://localhost:3001";

export const buildProductServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Product Service API",
    version: "1.0.0",
    description: "Product endpoints for KeJepangDulu",
    servers: [
      {
        url: "{productServiceBaseUrl}",
        description: "Product service base URL",
        variables: {
          productServiceBaseUrl: {
            default: productServiceLocalBaseUrl,
            description: "Product service local base URL"
          }
        }
      }
    ],
    includeBearerAuth: true,
    tags: [{ name: "Product", description: "Product browsing operations" }],
    paths: productServicePaths
  });
};

export const generateProductServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildProductServiceOpenApi());
};
