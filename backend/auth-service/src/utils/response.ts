import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const resolveAllowOrigin = (event: APIGatewayProxyEventV2): string => {
  const configuredOrigin = process.env.AUTH_ALLOWED_ORIGIN?.trim();
  if (configuredOrigin) {
    return configuredOrigin;
  }

  const requestOrigin = event.headers.origin ?? event.headers.Origin;
  if (requestOrigin && requestOrigin.trim()) {
    return requestOrigin;
  }

  return "*";
};

const buildCorsHeaders = (event: APIGatewayProxyEventV2): Record<string, string> => {
  const allowOrigin = resolveAllowOrigin(event);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "access-control-allow-origin": allowOrigin,
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "OPTIONS,GET,POST"
  };

  if (allowOrigin !== "*") {
    headers["access-control-allow-credentials"] = "true";
    headers["vary"] = "Origin";
  }

  return headers;
};

interface JsonResponseOptions {
  cookies?: string[];
}

export const jsonResponse = (
  event: APIGatewayProxyEventV2,
  statusCode: number,
  body: unknown,
  options: JsonResponseOptions = {}
): APIGatewayProxyStructuredResultV2 => {
  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode,
    headers: buildCorsHeaders(event),
    body: JSON.stringify(body)
  };

  if (options.cookies && options.cookies.length > 0) {
    response.cookies = options.cookies;
  }

  return response;
};

export const optionsResponse = (
  event: APIGatewayProxyEventV2,
  cookies: string[] = []
): APIGatewayProxyStructuredResultV2 => {
  const response: APIGatewayProxyStructuredResultV2 = {
    statusCode: 204,
    headers: buildCorsHeaders(event),
    body: ""
  };

  if (cookies.length > 0) {
    response.cookies = cookies;
  }

  return response;
};
