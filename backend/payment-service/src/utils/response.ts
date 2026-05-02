import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";

const corsHeaders = {
  "content-type": "application/json",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type,authorization",
  "access-control-allow-methods": "OPTIONS,POST"
};

export const jsonResponse = (
  statusCode: number,
  body: unknown
): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body)
  };
};

export const optionsResponse = (): APIGatewayProxyStructuredResultV2 => {
  return {
    statusCode: 204,
    headers: corsHeaders,
    body: ""
  };
};
