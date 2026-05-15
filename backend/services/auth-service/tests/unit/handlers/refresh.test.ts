import { APIGatewayProxyEventV2 } from "aws-lambda";
import { refresh } from "../../../src/handlers/refresh";
import { buildRefreshCookie, extractRefreshToken } from "@shared-utils/cookies";
import { createErrorResponse, createSuccessResponse } from "@shared-utils/response";
import { getAuthUserFromIdToken } from "../../../src/services/token";
import { CognitoOperationError, refreshWithToken } from "../../../src/services/cognito";

jest.mock("@shared-utils/cookies", () => ({
  buildRefreshCookie: jest.fn(),
  extractRefreshToken: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn((_: unknown, statusCode: number, message: string, meta: unknown) => ({
    statusCode,
    message,
    meta,
    kind: "error"
  })),
  createSuccessResponse: jest.fn(
    (_: unknown, statusCode: number, data: unknown, options?: { cookies?: string[] }) => ({
      statusCode,
      data,
      options,
      kind: "success"
    })
  )
}));

jest.mock("../../../src/services/token", () => ({
  getAuthUserFromIdToken: jest.fn()
}));

jest.mock("../../../src/services/cognito", () => {
  class MockCognitoOperationError extends Error {
    readonly code: string;
    readonly statusCode: number;

    constructor(message: string, code = "InternalError", statusCode = 500) {
      super(message);
      this.code = code;
      this.statusCode = statusCode;
    }
  }

  return {
    CognitoOperationError: MockCognitoOperationError,
    refreshWithToken: jest.fn()
  };
});

const createEvent = (): APIGatewayProxyEventV2 => ({
  requestContext: {
    http: {
      method: "POST"
    }
  },
  routeKey: "POST /api/auth/refresh"
} as APIGatewayProxyEventV2);

describe("refresh handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when refresh token is not found", async () => {
    const event = createEvent();
    (extractRefreshToken as jest.Mock).mockReturnValue("");

    const result = await refresh(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 401, "Refresh token not found", {
      code: "REFRESH_TOKEN_NOT_FOUND"
    });
    expect(result).toEqual({
      statusCode: 401,
      message: "Refresh token not found",
      meta: { code: "REFRESH_TOKEN_NOT_FOUND" },
      kind: "error"
    });
    expect(refreshWithToken).not.toHaveBeenCalled();
  });

  it("refreshes session and uses returned refresh token", async () => {
    const event = createEvent();
    const user = {
      id: "user-1",
      email: "user@example.com",
      name: "User"
    };

    (extractRefreshToken as jest.Mock).mockReturnValue("old-rt");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "new-access",
      idToken: "new-id",
      expiresIn: 3600,
      tokenType: "Bearer",
      refreshToken: "new-rt"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(user);
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=new-rt");

    const result = await refresh(event);

    expect(refreshWithToken).toHaveBeenCalledWith("old-rt");
    expect(getAuthUserFromIdToken).toHaveBeenCalledWith("new-id");
    expect(buildRefreshCookie).toHaveBeenCalledWith("new-rt");
    expect(createSuccessResponse).toHaveBeenCalledWith(
      event,
      200,
      {
        accessToken: "new-access",
        idToken: "new-id",
        expiresIn: 3600,
        tokenType: "Bearer",
        user
      },
      {
        cookies: ["kjl_rt=new-rt"]
      }
    );
    expect(result).toEqual({
      statusCode: 200,
      data: {
        accessToken: "new-access",
        idToken: "new-id",
        expiresIn: 3600,
        tokenType: "Bearer",
        user
      },
      options: {
        cookies: ["kjl_rt=new-rt"]
      },
      kind: "success"
    });
  });

  it("falls back to existing refresh token when upstream omits next token", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("existing-rt");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "new-access",
      idToken: "new-id",
      expiresIn: 1800,
      tokenType: "Bearer"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue({
      id: "user-1",
      email: "user@example.com",
      name: "User"
    });
    (buildRefreshCookie as jest.Mock).mockReturnValue("kjl_rt=existing-rt");

    await refresh(event);

    expect(buildRefreshCookie).toHaveBeenCalledWith("existing-rt");
  });

  it("returns 502 when refreshed ID token cannot be parsed", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("rt");
    (refreshWithToken as jest.Mock).mockResolvedValue({
      accessToken: "a",
      idToken: "id",
      expiresIn: 1800,
      tokenType: "Bearer"
    });
    (getAuthUserFromIdToken as jest.Mock).mockReturnValue(null);

    const result = await refresh(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 502, "Invalid ID token in refresh response", {
      code: "INVALID_ID_TOKEN"
    });
    expect(result).toEqual({
      statusCode: 502,
      message: "Invalid ID token in refresh response",
      meta: { code: "INVALID_ID_TOKEN" },
      kind: "error"
    });
  });

  it("maps CognitoOperationError to API error response", async () => {
    const event = createEvent();
    const cognitoError = new CognitoOperationError("Token expired", "NotAuthorizedException", 401);

    (extractRefreshToken as jest.Mock).mockReturnValue("rt");
    (refreshWithToken as jest.Mock).mockRejectedValue(cognitoError);

    const result = await refresh(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 401, "Token expired", {
      code: "NotAuthorizedException"
    });
    expect(result).toEqual({
      statusCode: 401,
      message: "Token expired",
      meta: { code: "NotAuthorizedException" },
      kind: "error"
    });
  });

  it("returns generic 500 for unexpected errors", async () => {
    const event = createEvent();

    (extractRefreshToken as jest.Mock).mockReturnValue("rt");
    (refreshWithToken as jest.Mock).mockRejectedValue(new Error("network"));

    const result = await refresh(event);

    expect(createErrorResponse).toHaveBeenCalledWith(event, 500, "Failed to refresh session", {
      code: "REFRESH_FAILED"
    });
    expect(result).toEqual({
      statusCode: 500,
      message: "Failed to refresh session",
      meta: { code: "REFRESH_FAILED" },
      kind: "error"
    });
  });
});
