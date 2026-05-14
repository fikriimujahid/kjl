import { OpenApiDocument, OpenApiPathItem, createOpenApiDocument } from "./openapi";
import { bearerAuthScheme } from "./auth";

export interface BuildOpenApiOptions {
  title: string;
  version: string;
  description?: string;
  paths: Record<string, OpenApiPathItem>;
  includeBearerAuth?: boolean;
  schemas?: Record<string, unknown>;
  tags?: Array<{ name: string; description?: string }>;
}

export const buildOpenApiDocument = (options: BuildOpenApiOptions): OpenApiDocument => {
  const document = createOpenApiDocument(
    {
      title: options.title,
      version: options.version,
      description: options.description
    },
    options.paths
  );

  const components: NonNullable<OpenApiDocument["components"]> = {};

  if (options.schemas) {
    components.schemas = options.schemas as NonNullable<OpenApiDocument["components"]>["schemas"];
  }

  if (options.includeBearerAuth) {
    components.securitySchemes = { bearerAuth: bearerAuthScheme };
  }

  if (Object.keys(components).length > 0) {
    document.components = components;
  }

  if (options.tags && options.tags.length > 0) {
    document.tags = options.tags;
  }

  return document;
};

export const generateOpenApiJson = (document: OpenApiDocument): string => {
  return JSON.stringify(document, null, 2);
};
