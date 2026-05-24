import { APIGatewayProxyEventV2 } from "aws-lambda";
import { parseEventBody } from "../../src/utils/request";

const createEvent = (body?: string, isBase64Encoded = false): APIGatewayProxyEventV2 =>
  ({
    version: "2.0",
    routeKey: "POST /test",
    rawPath: "/test",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: "POST",
        path: "/test",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest"
      },
      requestId: "req-request",
      routeKey: "POST /test",
      stage: "$default",
      time: "15/May/2026:00:00:00 +0000",
      timeEpoch: Date.now()
    },
    body,
    isBase64Encoded
  }) as APIGatewayProxyEventV2;

describe("parseEventBody", () => {
  it("returns empty object when body is missing", () => {
    expect(parseEventBody(createEvent(undefined))).toEqual({});
  });

  it("returns empty object when body is empty string", () => {
    expect(parseEventBody(createEvent(""))).toEqual({});
  });

  it("parses plain JSON body", () => {
    const result = parseEventBody(createEvent('{"productId":"product-1"}'));

    expect(result).toEqual({ productId: "product-1" });
  });

  it("parses base64 encoded JSON body", () => {
    const rawPayload = '{"order_id":"ORDER-1"}';
    const encodedPayload = Buffer.from(rawPayload, "utf8").toString("base64");

    const result = parseEventBody(createEvent(encodedPayload, true));

    expect(result).toEqual({ order_id: "ORDER-1" });
  });

  it("throws when JSON body is invalid", () => {
    expect(() => parseEventBody(createEvent("{invalid-json}"))).toThrow();
  });
});
