import { APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { jsonResponse } from "../utils/response";
import { ApplicationError } from "./applicationErrors";

export const mapErrorToResponse = (
  error: unknown
): APIGatewayProxyStructuredResultV2 | null => {
  if (!(error instanceof ApplicationError)) {
    return null;
  }

  return jsonResponse(error.statusCode, { message: error.message });
};