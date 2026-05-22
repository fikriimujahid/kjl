import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  SessionAttemptNotFoundError,
  UnsupportedSessionTypeError
} from "../../src/errors/applicationErrors";
import { finishSessionAttemptHandler } from "../../src/handlers/finishSessionAttemptHandler";
import { finishSessionAttempt } from "../../src/use-cases/finishSessionAttempt";

jest.mock("../../src/use-cases/finishSessionAttempt", () => ({
  finishSessionAttempt: jest.fn()
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

const createEvent = (
  pathParameters?: Record<string, string>,
  body?: unknown
): APIGatewayProxyEventV2 =>
  ({
    routeKey:
      "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish",
    pathParameters,
    body: body ? JSON.stringify(body) : undefined,
    requestContext: {
      http: {
        method: "POST"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("finishSessionAttemptHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const finishSessionAttemptMock = finishSessionAttempt as jest.MockedFunction<typeof finishSessionAttempt>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when attempt id is missing", async () => {
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      {
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true
      }
    );

    const result = await finishSessionAttemptHandler(event);

    expect(finishSessionAttemptMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing attempt id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing attempt id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 404 when attempt does not exist", async () => {
    const event = createEvent(
      {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        attemptId: "attempt-99"
      },
      {
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true
      }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    finishSessionAttemptMock.mockRejectedValue(new SessionAttemptNotFoundError("attempt-99"));

    const result = await finishSessionAttemptHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 404, "Session attempt not found: attempt-99", {
      code: "SESSION_ATTEMPT_NOT_FOUND"
    });
    expect(result).toEqual({
      statusCode: 404,
      message: "Session attempt not found: attempt-99",
      meta: {
        code: "SESSION_ATTEMPT_NOT_FOUND"
      },
      kind: "error"
    });
  });

  it("returns 400 when session type is not supported", async () => {
    const event = createEvent(
      {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        attemptId: "attempt-1"
      },
      {
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true
      }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    finishSessionAttemptMock.mockRejectedValue(new UnsupportedSessionTypeError("images"));

    const result = await finishSessionAttemptHandler(event);

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

  it("returns completed attempt payload when request succeeds", async () => {
    const event = createEvent(
      {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        attemptId: "attempt-1"
      },
      {
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true,
        durationSeconds: 4200
      }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });

    finishSessionAttemptMock.mockResolvedValue({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      sessionType: "exam",
      hasActiveAttempt: false,
      attempt: {
        attemptId: "attempt-1",
        attemptNumber: 1,
        status: "FINISHED",
        isActive: false,
        startedAt: "2026-05-22T10:00:00.000Z",
        finishedAt: "2026-05-22T11:10:00.000Z",
        updatedAt: "2026-05-22T11:10:00.000Z",
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true,
        durationSeconds: 4200
      },
      attempts: [
        {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "FINISHED",
          isActive: false,
          startedAt: "2026-05-22T10:00:00.000Z",
          finishedAt: "2026-05-22T11:10:00.000Z",
          updatedAt: "2026-05-22T11:10:00.000Z",
          totalQuestions: 65,
          correctAnswers: 52,
          maxScore: 65,
          obtainedScore: 52,
          percentage: 80,
          passingScore: 72,
          passed: true,
          durationSeconds: 4200
        }
      ]
    });

    const result = await finishSessionAttemptHandler(event);

    expect(finishSessionAttemptMock).toHaveBeenCalledWith({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      attemptId: "attempt-1",
      totalQuestions: 65,
      correctAnswers: 52,
      maxScore: 65,
      obtainedScore: 52,
      percentage: 80,
      passingScore: 72,
      passed: true,
      durationSeconds: 4200,
      authenticatedUserId: "user-1"
    });

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      sessionType: "exam",
      hasActiveAttempt: false,
      attempt: {
        attemptId: "attempt-1",
        attemptNumber: 1,
        status: "FINISHED",
        isActive: false,
        startedAt: "2026-05-22T10:00:00.000Z",
        finishedAt: "2026-05-22T11:10:00.000Z",
        updatedAt: "2026-05-22T11:10:00.000Z",
        totalQuestions: 65,
        correctAnswers: 52,
        maxScore: 65,
        obtainedScore: 52,
        percentage: 80,
        passingScore: 72,
        passed: true,
        durationSeconds: 4200
      },
      attempts: [
        {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "FINISHED",
          isActive: false,
          startedAt: "2026-05-22T10:00:00.000Z",
          finishedAt: "2026-05-22T11:10:00.000Z",
          updatedAt: "2026-05-22T11:10:00.000Z",
          totalQuestions: 65,
          correctAnswers: 52,
          maxScore: 65,
          obtainedScore: 52,
          percentage: 80,
          passingScore: 72,
          passed: true,
          durationSeconds: 4200
        }
      ]
    });

    expect(result).toEqual({
      statusCode: 200,
      data: {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        sessionType: "exam",
        hasActiveAttempt: false,
        attempt: {
          attemptId: "attempt-1",
          attemptNumber: 1,
          status: "FINISHED",
          isActive: false,
          startedAt: "2026-05-22T10:00:00.000Z",
          finishedAt: "2026-05-22T11:10:00.000Z",
          updatedAt: "2026-05-22T11:10:00.000Z",
          totalQuestions: 65,
          correctAnswers: 52,
          maxScore: 65,
          obtainedScore: 52,
          percentage: 80,
          passingScore: 72,
          passed: true,
          durationSeconds: 4200
        },
        attempts: [
          {
            attemptId: "attempt-1",
            attemptNumber: 1,
            status: "FINISHED",
            isActive: false,
            startedAt: "2026-05-22T10:00:00.000Z",
            finishedAt: "2026-05-22T11:10:00.000Z",
            updatedAt: "2026-05-22T11:10:00.000Z",
            totalQuestions: 65,
            correctAnswers: 52,
            maxScore: 65,
            obtainedScore: 52,
            percentage: 80,
            passingScore: 72,
            passed: true,
            durationSeconds: 4200
          }
        ]
      },
      kind: "success"
    });
  });
});
