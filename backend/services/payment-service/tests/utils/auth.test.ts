import { APIGatewayProxyEventV2 } from "aws-lambda";
import { getAuthenticatedUser } from "../../src/utils/auth";

const createEvent = (claims?: Record<string, string>): APIGatewayProxyEventV2 =>
  ({
    version: "2.0",
    routeKey: "GET /test",
    rawPath: "/test",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: "GET",
        path: "/test",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest"
      },
      requestId: "req-auth",
      routeKey: "GET /test",
      stage: "$default",
      time: "15/May/2026:00:00:00 +0000",
      timeEpoch: Date.now(),
      authorizer: claims ? { jwt: { claims } } : undefined
    },
    isBase64Encoded: false
  }) as APIGatewayProxyEventV2;

describe("getAuthenticatedUser", () => {
  it("returns null when jwt claims are missing", () => {
    expect(getAuthenticatedUser(createEvent())).toBeNull();
  });

  it("returns null when user id claims are absent", () => {
    const event = createEvent({ email: "user@example.com" });
    expect(getAuthenticatedUser(event)).toBeNull();
  });

  it("uses sub claim as primary user id", () => {
    const event = createEvent({
      sub: "user-sub",
      "cognito:username": "fallback-user",
      email: "user@example.com",
      name: "Demo User"
    });

    expect(getAuthenticatedUser(event)).toEqual({
      id: "user-sub",
      email: "user@example.com",
      name: "Demo User"
    });
  });

  it("falls back to cognito:username when sub is missing", () => {
    const event = createEvent({
      "cognito:username": "cognito-user",
      email: "user@example.com"
    });

    expect(getAuthenticatedUser(event)).toEqual({
      id: "cognito-user",
      email: "user@example.com",
      name: ""
    });
  });

  it("defaults optional profile claims to empty strings", () => {
    const event = createEvent({ sub: "user-1" });

    expect(getAuthenticatedUser(event)).toEqual({
      id: "user-1",
      email: "",
      name: ""
    });
  });
});
