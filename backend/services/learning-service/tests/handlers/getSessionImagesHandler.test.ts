import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "@shared-utils/auth";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import {
  ForbiddenLearningContentAccessError,
  UnsupportedSessionTypeError
} from "../../src/errors/applicationErrors";
import { getSessionImagesHandler } from "../../src/handlers/getSessionImagesHandler";
import { getSessionImages } from "../../src/use-cases/getSessionImages";

jest.mock("../../src/use-cases/getSessionImages", () => ({
  getSessionImages: jest.fn()
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
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images",
    pathParameters,
    requestContext: {
      http: {
        method: "GET"
      }
    }
  }) as APIGatewayProxyEventV2;

describe("getSessionImagesHandler", () => {
  const getAuthenticatedUserMock = getAuthenticatedUser as jest.MockedFunction<typeof getAuthenticatedUser>;
  const getSessionImagesMock = getSessionImages as jest.MockedFunction<typeof getSessionImages>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when product id is missing", async () => {
    const event = createEvent({ topicId: "topic-1", sessionId: "session-1" });

    const result = await getSessionImagesHandler(event);

    expect(getSessionImagesMock).not.toHaveBeenCalled();
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
    getSessionImagesMock.mockRejectedValue(new ForbiddenLearningContentAccessError());

    const result = await getSessionImagesHandler(event);

    expect(getSessionImagesMock).toHaveBeenCalledWith({
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

  it("returns 400 when session type is not images", async () => {
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
    getSessionImagesMock.mockRejectedValue(new UnsupportedSessionTypeError("quiz"));

    const result = await getSessionImagesHandler(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 400, "Unsupported session type: quiz", {
      code: "UNSUPPORTED_SESSION_TYPE"
    });
    expect(result).toEqual({
      statusCode: 400,
      message: "Unsupported session type: quiz",
      meta: {
        code: "UNSUPPORTED_SESSION_TYPE"
      },
      kind: "error"
    });
  });

  it("returns signed image URLs when request succeeds", async () => {
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
    getSessionImagesMock.mockResolvedValue({
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      images: ["https://signed-url/image1.jpg", "https://signed-url/image2.jpg"]
    });

    const result = await getSessionImagesHandler(event);

    expect(createSuccessResponse).toHaveBeenCalledWith(event, 200, {
      productId: "prod-1",
      topicId: "topic-1",
      sessionId: "session-1",
      images: ["https://signed-url/image1.jpg", "https://signed-url/image2.jpg"]
    });
    expect(result).toEqual({
      statusCode: 200,
      data: {
        productId: "prod-1",
        topicId: "topic-1",
        sessionId: "session-1",
        images: ["https://signed-url/image1.jpg", "https://signed-url/image2.jpg"]
      },
      kind: "success"
    });
  });
});
