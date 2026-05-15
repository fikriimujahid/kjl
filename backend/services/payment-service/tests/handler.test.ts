import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { createErrorResponse, optionsResponse } from "@shared-utils/response";
import { handler } from "../src/handler";
import { createPayment } from "../src/handlers/createPayment";
import { handleWebhook } from "../src/handlers/handleWebhook";
import { ROUTES } from "../src/routes";

jest.mock("../src/handlers/createPayment", () => ({
  createPayment: jest.fn()
}));

jest.mock("../src/handlers/handleWebhook", () => ({
  handleWebhook: jest.fn()
}));

jest.mock("@shared-utils/response", () => ({
  createErrorResponse: jest.fn(),
  optionsResponse: jest.fn()
}));

describe("payment-service handler routing", () => {
  const createPaymentMock = createPayment as jest.MockedFunction<typeof createPayment>;
  const handleWebhookMock = handleWebhook as jest.MockedFunction<typeof handleWebhook>;
  const createErrorResponseMock = createErrorResponse as jest.MockedFunction<typeof createErrorResponse>;
  const optionsResponseMock = optionsResponse as jest.MockedFunction<typeof optionsResponse>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createEvent = (routeKey: string, method = "POST"): APIGatewayProxyEventV2 =>
    ({
      version: "2.0",
      routeKey,
      rawPath: "/api/payments",
      rawQueryString: "",
      headers: {},
      requestContext: {
        accountId: "test-account",
        apiId: "test-api",
        domainName: "localhost",
        domainPrefix: "localhost",
        http: {
          method,
          path: "/api/payments",
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "jest"
        },
        requestId: "req-1",
        routeKey,
        stage: "$default",
        time: "15/May/2026:00:00:00 +0000",
        timeEpoch: Date.now()
      },
      isBase64Encoded: false
    }) as APIGatewayProxyEventV2;

  it("returns CORS response for OPTIONS requests", async () => {
    const event = createEvent("OPTIONS /api/payments/create", "OPTIONS");
    const optionsResult: ReturnType<typeof optionsResponse> = { statusCode: 204, body: "" };

    optionsResponseMock.mockReturnValue(optionsResult);

    const result = await handler(event);

    expect(optionsResponseMock).toHaveBeenCalledWith(event);
    expect(result).toBe(optionsResult);
  });

  it("dispatches create payment route", async () => {
    const event = createEvent(ROUTES.CREATE_PAYMENT.routeKey);
    const response = { statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2;

    createPaymentMock.mockResolvedValue(response);

    const result = await handler(event);

    expect(createPaymentMock).toHaveBeenCalledWith(event);
    expect(handleWebhookMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  it("dispatches webhook route", async () => {
    const event = createEvent(ROUTES.HANDLE_WEBHOOK.routeKey);
    const response = { statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2;

    handleWebhookMock.mockResolvedValue(response);

    const result = await handler(event);

    expect(handleWebhookMock).toHaveBeenCalledWith(event);
    expect(createPaymentMock).not.toHaveBeenCalled();
    expect(result).toBe(response);
  });

  it("returns not found response for unsupported route", async () => {
    const event = createEvent("GET /api/payments/unknown", "GET");
    const notFound: ReturnType<typeof createErrorResponse> = { statusCode: 404, body: "{}" };

    createErrorResponseMock.mockReturnValue(notFound);

    const result = await handler(event);

    expect(createErrorResponseMock).toHaveBeenCalledWith(event, 404, "Route not found", {
      code: "ROUTE_NOT_FOUND"
    });
    expect(result).toBe(notFound);
  });

  it("logs incoming request metadata", async () => {
    const event = createEvent(ROUTES.CREATE_PAYMENT.routeKey);

    createPaymentMock.mockResolvedValue({ statusCode: 200, body: "{}" } as APIGatewayProxyStructuredResultV2);

    await handler(event);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('"event":"request.received"')
    );

    expect(JSON.parse((console.info as jest.Mock).mock.calls[0][0] as string)).toEqual(
      expect.objectContaining({
        service: "payment-service",
        routeKey: ROUTES.CREATE_PAYMENT.routeKey,
        requestId: "req-1",
        method: "POST"
      })
    );
  });
});
