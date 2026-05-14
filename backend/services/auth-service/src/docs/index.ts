import { buildOpenApiDocument, generateOpenApiJson } from "@shared-swagger/generate";
import { OpenApiPathItem } from "@shared-swagger/openapi";
import { loginDocPath, loginDocPathItem } from "./login.doc";

export const authServicePaths: Record<string, OpenApiPathItem> = {
  [loginDocPath]: loginDocPathItem
};

export const buildAuthServiceOpenApi = () => {
  return buildOpenApiDocument({
    title: "Auth Service API",
    version: "1.0.0",
    description: "Auth endpoints for KeJepangDulu",
    includeBearerAuth: true,
    tags: [{ name: "Auth", description: "Authentication operations" }],
    paths: authServicePaths
  });
};

export const generateAuthServiceOpenApiJson = (): string => {
  return generateOpenApiJson(buildAuthServiceOpenApi());
};
