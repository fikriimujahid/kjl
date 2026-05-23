import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  ForbiddenLearningContentAccessError,
  UnsupportedSessionTypeError
} from "../../src/errors/applicationErrors";
import { startSessionAttemptHandler } from "../../src/handlers/startSessionAttemptHandler";
import { startSessionAttempt } from "../../src/use-cases/startSessionAttempt";

jest.mock("../../src/use-cases/startSessionAttempt", () => ({
  startSessionAttempt: jest.fn()
}));

jest.mock("@shared-utils/auth", () => ({
  getAuthenticatedUser: jest.fn()
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

const createEvent = (pathParameters?: Record<string, string>): APIGatewayProxyEventV2 =>
  ({
    routeKey: "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start",
    pathParameters,
    requestContext: {
      http: {
        method: "POST"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("startSessionAttemptHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const startSessionAttemptMock = startSessionAttempt as jest.MockedFunction<typeof startSessionAttempt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when product id is missing", async () => {
    const event = createEvent({ topicId: "topic-1", sessionId: "session-1" });

    const result = await startSessionAttemptHandler(event);

    expect(startSessionAttemptMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing product id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing product id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 403 when user has no access to product", async () => {
    const event = createEvent({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1"
    });

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    startSessionAttemptMock.mockRejectedValue(new ForbiddenLearningContentAccessError());

    const result = await startSessionAttemptHandler(event);

    expect(startSessionAttemptMock).toHaveBeenCalledWith({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      authenticatedUserId: "user-1"
    });
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

  it("returns 400 when session type is not supported", async () => {
    const event = createEvent({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1"
    });

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    startSessionAttemptMock.mockRejectedValue(new UnsupportedSessionTypeError("images"));

    const result = await startSessionAttemptHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Unsupported session type: images", {
      code: "UNSUPPORTED_SESSION_TYPE"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Unsupported session type: images",
      meta: {
        code: "UNSUPPORTED_SESSION_TYPE"
      },
      kind: "error"
    });
  });

  it("returns active attempt payload when request succeeds", async () => {
    const event = createEvent({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1"
    });

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });

    startSessionAttemptMock.mockResolvedValue({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      sessionType: "practice",
      resumed: false,
      hasActiveAttempt: true,
      attempt: {
        attemptId: "attempt-1",
        attemptNumber: 1,
        status: "ACTIVE",
        isActive: true,
        startedAt: "2026-05-22T10:00:00.000Z",
        updatedAt: "2026-05-22T10:00:00.000Z"
      },
      attempts: [
        {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "ACTIVE",
          isActive: true,
          startedAt: "2026-05-22T10:00:00.000Z",
          updatedAt: "2026-05-22T10:00:00.000Z"
        }
      ]
    });

    const result = await startSessionAttemptHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      sessionType: "practice",
      resumed: false,
      hasActiveAttempt: true,
      attempt: {
        attemptId: "attempt-1",
        attemptNumber: 1,
        status: "ACTIVE",
        isActive: true,
        startedAt: "2026-05-22T10:00:00.000Z",
        updatedAt: "2026-05-22T10:00:00.000Z"
      },
      attempts: [
        {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "ACTIVE",
          isActive: true,
          startedAt: "2026-05-22T10:00:00.000Z",
          updatedAt: "2026-05-22T10:00:00.000Z"
        }
      ]
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        sessionType: "practice",
        resumed: false,
        hasActiveAttempt: true,
        attempt: {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "ACTIVE",
          isActive: true,
          startedAt: "2026-05-22T10:00:00.000Z",
          updatedAt: "2026-05-22T10:00:00.000Z"
        },
        attempts: [
          {
            attemptId: "attempt-1",
            attemptNumber: 1,
            status: "ACTIVE",
            isActive: true,
            startedAt: "2026-05-22T10:00:00.000Z",
            updatedAt: "2026-05-22T10:00:00.000Z"
          }
        ]
      },
      kind: "success"
    });
  });
});
