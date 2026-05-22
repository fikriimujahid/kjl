import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  ForbiddenLearningContentAccessError,
  UnsupportedSessionTypeError
} from "../../src/errors/applicationErrors";
import { getSessionQuestionsHandler } from "../../src/handlers/getSessionQuestionsHandler";
import { getSessionQuestions } from "../../src/use-cases/getSessionQuestions";

jest.mock("../../src/use-cases/getSessionQuestions", () => ({
  getSessionQuestions: jest.fn()
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
  pathParameters?: Record<string, string>
): APIGatewayProxyEventV2 =>
  ({
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions",
    pathParameters,
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("getSessionQuestionsHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const getSessionQuestionsMock = getSessionQuestions as jest.MockedFunction<typeof getSessionQuestions>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when product id is missing", async () => {
    const event = createEvent({ topicId: "topic-1", sessionId: "session-1" });

    const result = await getSessionQuestionsHandler(event);

    expect(getSessionQuestionsMock).not.toHaveBeenCalled();
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
    getSessionQuestionsMock.mockRejectedValue(new ForbiddenLearningContentAccessError());

    const result = await getSessionQuestionsHandler(event);

    expect(getSessionQuestionsMock).toHaveBeenCalledWith({
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
    getSessionQuestionsMock.mockRejectedValue(new UnsupportedSessionTypeError("images"));

    const result = await getSessionQuestionsHandler(event);

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

  it("returns questions when request succeeds", async () => {
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
    getSessionQuestionsMock.mockResolvedValue({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      questions: [
        {
          id: "q1",
          text: "Question",
          options: [
            {
              id: "optA",
              text: "Option A"
            }
          ]
        }
      ]
    });

    const result = await getSessionQuestionsHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      questions: [
        {
          id: "q1",
          text: "Question",
          options: [
            {
              id: "optA",
              text: "Option A"
            }
          ]
        }
      ]
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        questions: [
          {
            id: "q1",
            text: "Question",
            options: [
              {
                id: "optA",
                text: "Option A"
              }
            ]
          }
        ]
      },
      kind: "success"
    });
  });
});
