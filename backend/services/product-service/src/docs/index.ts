import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { getOwnedProductsDocPath, getOwnedProductsDocPathItem } from "./getOwnedProducts.doc";
import { getProductDetailDocPath, getProductDetailDocPathItem } from "./getProductDetail.doc";
import { getProductsDocPath, getProductsDocPathItem } from "./getProducts.doc";

export const productServicePaths: Record<string, OpenApiPathItem> = {
  [getProductsDocPath]: getProductsDocPathItem,
  [getProductDetailDocPath]: getProductDetailDocPathItem,
  [getOwnedProductsDocPath]: getOwnedProductsDocPathItem
};

export const buildProductServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Product Service API",
    version: "1.0.0",
    description: "Product endpoints for KeJepangDulu",
    includeBearerAuth: true,
    tags: [{ name: "Product", description: "Product browsing and ownership operations" }],
    paths: productServicePaths
  });
};

export const generateProductServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildProductServiceOpenApi());
};
