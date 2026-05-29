import { APIGatewayProxyEventV2 } from "aws-lambda";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getSessionByIdInternalHandler } from "../../src/handlers/getSessionByIdInternalHandler";
import { getSessionByIdInternal } from "../../src/use-cases/getSessionByIdInternal";
import { SessionRecord } from "../../src/types/productTypes";

jest.mock("../../src/use-cases/getSessionByIdInternal", () => ({
  getSessionByIdInternal: jest.fn()
}));

jest.mock("../../src/config/env", () => ({
  getProductServiceEnv: jest.fn(() => ({
    DYNAMO_DB_TABLE_NAME: "test-table",
    MEDIA_PRIVATE_BUCKET_NAME: "test-bucket",
    PRODUCT_SERVICE_INTERNAL_SERVICE_API_KEY: "internal-secret"
  }))
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn((_: unknown, statusCode: number, message: string, meta: unknown) => ({
    statusCode,
    message,
    meta,
    kind: "error"
  })),
  createSuccessResponse: jest.fn((_: unknown, statusCode: number, data: unknown) => ({
    statusCode,
    data,
    kind: "success"
  }))
}));

const createEvent = (
  pathParameters?: Record<string, string>,
  headers?: Record<string, string>
): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}",
    pathParameters,
    headers,
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("getSessionByIdInternalHandler", () => {
  const getSessionByIdInternalMock = getSessionByIdInternal as jest.MockedFunction<typeof getSessionByIdInternal>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when required path params are missing", async () => {
    const event = createEvent({ productId: "prod-1", topicId: "topic-1" }, {
      "x-internal-api-key": "internal-secret"
    });

    const result = await getSessionByIdInternalHandler(event);

    expect(getSessionByIdInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing session id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing session id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 403 when internal api key is invalid", async () => {
    const event = createEvent({ productId: "prod-1", topicId: "topic-1", sessionId: "session-1" });

    const result = await getSessionByIdInternalHandler(event);

    expect(getSessionByIdInternalMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 403, "Forbidden", {
      code: "FORBIDDEN"
    });
    expect(result).toEqual({
      statusCode: 403,
      message: "Forbidden",
      meta: {
        code: "FORBIDDEN"
      },
      kind: "error"
    });
  });

  it("returns 200 with session data when the lookup succeeds", async () => {
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      { "x-internal-api-key": "internal-secret" }
    );
    const session: SessionRecord = {
      PK: "PRODUCT#prod-1",
      SK: "SESSION#topic-1#session-1",
      entityType: "SESSION",
      productId: "prod-1",
      topicId: "topic-1",
      sessionOrder: 1,
      id: "session-1",
      title: "Image Session",
      type: "images",
      contentUrl: "images/session-1/index.json"
    };

    getSessionByIdInternalMock.mockResolvedValue(session);

    const result = await getSessionByIdInternalHandler(event);

    expect(getSessionByIdInternalMock).toHaveBeenCalledWith({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1"
    });
    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, session);
    expect(result).toEqual({
      statusCode: 200,
      data: session,
      kind: "success"
    });
  });
});