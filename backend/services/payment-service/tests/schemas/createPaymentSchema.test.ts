import { createPaymentSchema } from "../../src/schemas/createPaymentSchema";

const createEvent = (body?: string): never =>
  ({
    version: "2.0",
    routeKey: "POST /api/payments/create",
    rawPath: "/api/payments/create",
    rawQueryString: "",
    headers: {},
    requestContext: {
      accountId: "test-account",
      apiId: "test-api",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: "POST",
        path: "/api/payments/create",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "jest"
      },
      requestId: "req-create-payment-schema",
      routeKey: "POST /api/payments/create",
      stage: "$default",
      time: "16/May/2026:00:00:00 +0000",
      timeEpoch: Date.now()
    },
    isBase64Encoded: false,
    body
  }) as never;

describe("createPaymentSchema.safeParse", () => {
  it("parses valid payload and trims productId", () => {
    const result = createPaymentSchema.safeParse({ productId: "  product-1  " });

    expect(result).toEqual({
      success: true,
      data: {
        productId: "product-1"
      }
    });
  });

  it.each([
    ["missing field", {}],
    ["empty string", { productId: "" }],
    ["whitespace", { productId: "   " }],
    ["non-string", { productId: 123 }],
    ["null input", null],
    ["array input", []],
    ["string input", "abc"]
  ])("returns validation error for %s", (_, payload) => {
    const result = createPaymentSchema.safeParse(payload as never);

    expect(result).toEqual({
      success: false,
      error: "productId is required"
    });
  });

  it("parses valid API Gateway event body", () => {
    const result = createPaymentSchema.safeParseEvent(
      createEvent(JSON.stringify({ productId: " product-1 " }))
    );

    expect(result).toEqual({
      success: true,
      data: {
        productId: "product-1"
      }
    });
  });

  it("returns invalid JSON error for malformed body in API Gateway event", () => {
    const result = createPaymentSchema.safeParseEvent(createEvent("{"));

    expect(result).toEqual({
      success: false,
      error: "Invalid JSON body"
    });
  });
});
