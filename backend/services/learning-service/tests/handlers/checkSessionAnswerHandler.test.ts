import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  ForbiddenLearningContentAccessError,
  UnsupportedSessionTypeError
} from "../../src/errors/applicationErrors";
import { checkSessionAnswerHandler } from "../../src/handlers/checkSessionAnswerHandler";
import { checkSessionAnswer } from "../../src/use-cases/checkSessionAnswer";

jest.mock("../../src/use-cases/checkSessionAnswer", () => ({
  checkSessionAnswer: jest.fn()
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
    routeKey: "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check",
    pathParameters,
    body: body ? JSON.stringify(body) : undefined,
    requestContext: {
      http: {
        method: "POST"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("checkSessionAnswerHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const checkSessionAnswerMock = checkSessionAnswer as jest.MockedFunction<typeof checkSessionAnswer>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when question id is missing", async () => {
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      { selectedOptionId: "optA" }
    );

    const result = await checkSessionAnswerHandler(event);

    expect(checkSessionAnswerMock).not.toHaveBeenCalled();
    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Missing question id", {
      code: "VALIDATION_ERROR"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Missing question id",
      meta: {
        code: "VALIDATION_ERROR"
      },
      kind: "error"
    });
  });

  it("returns 403 when user has no access to product", async () => {
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      { questionId: "q1", selectedOptionId: "optA" }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    checkSessionAnswerMock.mockRejectedValue(new ForbiddenLearningContentAccessError());

    const result = await checkSessionAnswerHandler(event);

    expect(checkSessionAnswerMock).toHaveBeenCalledWith({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      questionId: "q1",
      selectedOptionId: "optA",
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
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      { questionId: "q1", selectedOptionId: "optA" }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    checkSessionAnswerMock.mockRejectedValue(new UnsupportedSessionTypeError("exam"));

    const result = await checkSessionAnswerHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Unsupported session type: exam", {
      code: "UNSUPPORTED_SESSION_TYPE"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Unsupported session type: exam",
      meta: {
        code: "UNSUPPORTED_SESSION_TYPE"
      },
      kind: "error"
    });
  });

  it("returns check result when request succeeds", async () => {
    const event = createEvent(
      { productId: "prod-1", topicId: "topic-1", sessionId: "session-1" },
      { questionId: "q1", selectedOptionId: "optA" }
    );

    getAuthenticatedUserMock.mockReturnValue({
      id: "user-1",
      email: "",
      name: ""
    });
    checkSessionAnswerMock.mockResolvedValue({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      questionId: "q1",
      selectedOptionId: "optA",
      correctAnswer: "optB",
      isCorrect: false,
      score: 10,
      awardedScore: 0,
      explanation: "Sample explanation"
    });

    const result = await checkSessionAnswerHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      questionId: "q1",
      selectedOptionId: "optA",
      correctAnswer: "optB",
      isCorrect: false,
      score: 10,
      awardedScore: 0,
      explanation: "Sample explanation"
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        questionId: "q1",
        selectedOptionId: "optA",
        correctAnswer: "optB",
        isCorrect: false,
        score: 10,
        awardedScore: 0,
        explanation: "Sample explanation"
      },
      kind: "success"
    });
  });
});
