import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "@shared-utils/request";

interface GetProductsRequest {
  readonly _: never;
}

interface SafeParseSuccess<T> {
  success: true;
  data: T;
}

interface SafeParseFailure {
  success: false;
  error: string;
}

type SafeParseResult<T> = SafeParseSuccess<T> | SafeParseFailure;

const safeParseRequest = (): SafeParseResult<GetProductsRequest> => {
  return {
    success: true,
    data: {} as GetProductsRequest
  };
};

export const getProductsSchema = {
  safeParse: (_input: unknown): SafeParseResult<GetProductsRequest> => {
    return safeParseRequest();
  },
  safeParseEvent: (event: APIGatewayProxyEventV2): SafeParseResult<GetProductsRequest> => {
    try {
      parseEventBody(event);
      return safeParseRequest();
    } catch {
      return {
        success: false,
        error: "Invalid JSON body"
      };
    }
  }
};