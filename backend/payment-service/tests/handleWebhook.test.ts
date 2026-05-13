import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PaymentOrderRecord } from "../src/models/payment";

type HandleWebhookFn = (
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyStructuredResultV2>;

interface HandleWebhookMocks {
  parseEventBody: jest.Mock;
  validateWebhookSignature: jest.Mock;
  normalizePaymentStatus: jest.Mock;
  readPaymentOrder: jest.Mock;
  grantProductAccess: jest.Mock;
  savePaymentOrder: jest.Mock;
}

const ORIGINAL_ENV = process.env;

const buildEvent = (): APIGatewayProxyEventV2 => ({
  version: "2.0",
  routeKey: "POST /api/payments/webhook",
  rawPath: "/api/payments/webhook",
  rawQueryString: "",
  headers: {},
  requestContext: {
    accountId: "test-account",
    apiId: "test-api",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "POST",
      path: "/api/payments/webhook",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "jest"
    },
    requestId: "req-webhook",
    routeKey: "POST /api/payments/webhook",
    stage: "$default",
    time: "13/May/2026:00:00:00 +0000",
    timeEpoch: Date.now()
  },
  isBase64Encoded: false
}) as APIGatewayProxyEventV2;

const parseBody = (response: APIGatewayProxyStructuredResultV2): Record<string, unknown> => {
  return JSON.parse(response.body ?? "{}") as Record<string, unknown>;
};

const buildExistingOrder = (
  overrides: Partial<PaymentOrderRecord> = {}
): PaymentOrderRecord => ({
  PK: "PAYMENT#user-1",
  SK: "PAYMENT#KJL~user-1~lvyx6k00a",
  entityType: "PAYMENT_ORDER",
  orderId: "KJL~user-1~lvyx6k00a",
  userId: "user-1",
  productId: "product-1",
  productName: "Starter",
  amount: 199999,
  grossAmount: "199999.00",
  accessDurationDays: 30,
  snapToken: "snap-token",
  snapRedirectUrl: "https://pay.example/redirect",
  status: "CREATED",
  paymentProvider: "MIDTRANS",
  createdAt: "2026-05-13T00:00:00.000Z",
  updatedAt: "2026-05-13T00:00:00.000Z",
  ...overrides
});

const loadHandleWebhookModule = async (
  envOverrides: Record<string, string | undefined> = {}
): Promise<{ handleWebhook: HandleWebhookFn; mocks: HandleWebhookMocks }> => {
  jest.resetModules();

  process.env = {
    ...ORIGINAL_ENV,
    DYNAMO_DB_TABLE_NAME: "kjl-table",
    MIDTRANS_SERVER_KEY: "midtrans-server-key"
  };

  for (const [key, value] of Object.entries(envOverrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const mocks: HandleWebhookMocks = {
    parseEventBody: jest.fn(),
    validateWebhookSignature: jest.fn(),
    normalizePaymentStatus: jest.fn(),
    readPaymentOrder: jest.fn(),
    grantProductAccess: jest.fn(),
    savePaymentOrder: jest.fn()
  };

  jest.doMock("../src/utils/request", () => ({
    parseEventBody: mocks.parseEventBody
  }));

  jest.doMock("../src/services/midtransService", () => ({
    validateWebhookSignature: mocks.validateWebhookSignature,
    normalizePaymentStatus: mocks.normalizePaymentStatus
  }));

  jest.doMock("../src/services/paymentRepository", () => ({
    readPaymentOrder: mocks.readPaymentOrder,
    grantProductAccess: mocks.grantProductAccess,
    savePaymentOrder: mocks.savePaymentOrder
  }));

  const module = require("../src/handlers/handleWebhook") as {
    handleWebhook: HandleWebhookFn;
  };
  return { handleWebhook: module.handleWebhook as HandleWebhookFn, mocks };
};

describe("handleWebhook", () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns 500 when DYNAMO_DB_TABLE_NAME is missing", async () => {
    const { handleWebhook } = await loadHandleWebhookModule({ DYNAMO_DB_TABLE_NAME: undefined });

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing DYNAMO_DB_TABLE_NAME environment variable"
    });
  });

  it("returns 500 when MIDTRANS_SERVER_KEY is missing", async () => {
    const { handleWebhook } = await loadHandleWebhookModule({ MIDTRANS_SERVER_KEY: undefined });

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing MIDTRANS_SERVER_KEY environment variable"
    });
  });

  it("returns 400 when JSON body is invalid", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    mocks.parseEventBody.mockImplementation(() => {
      throw new Error("invalid json");
    });

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ message: "Invalid JSON body" });
  });

  it("returns 401 when Midtrans signature is invalid", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    mocks.parseEventBody.mockReturnValue({ order_id: "ORDER-1" });
    mocks.validateWebhookSignature.mockReturnValue(false);

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(401);
    expect(parseBody(response)).toEqual({ message: "Invalid Midtrans signature" });
  });

  it("returns 400 when order_id is missing", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    mocks.parseEventBody.mockReturnValue({ transaction_status: "pending" });
    mocks.validateWebhookSignature.mockReturnValue(true);

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ message: "Missing order_id" });
  });

  it("returns 502 when reading order fails", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    mocks.parseEventBody.mockReturnValue({ order_id: "ORDER-1" });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockRejectedValue(new Error("dynamo unavailable"));

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to read payment order" });
  });

  it("returns 404 when order is not found", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    mocks.parseEventBody.mockReturnValue({ order_id: "ORDER-1" });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(null);

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(404);
    expect(parseBody(response)).toEqual({ message: "Payment order not found" });
  });

  it("returns 502 when granting access fails for first SUCCESS webhook", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    const existingOrder = buildExistingOrder();

    mocks.parseEventBody.mockReturnValue({
      order_id: existingOrder.orderId,
      transaction_status: "settlement",
      fraud_status: "accept",
      status_code: 200,
      gross_amount: 199999
    });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(existingOrder);
    mocks.normalizePaymentStatus.mockReturnValue("SUCCESS");
    mocks.grantProductAccess.mockRejectedValue(new Error("grant failed"));

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to grant product access" });
  });

  it("returns 502 when updating order fails", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    const existingOrder = buildExistingOrder();

    mocks.parseEventBody.mockReturnValue({
      order_id: existingOrder.orderId,
      transaction_status: "pending",
      status_code: "201",
      gross_amount: "199999.00"
    });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(existingOrder);
    mocks.normalizePaymentStatus.mockReturnValue("PENDING");
    mocks.savePaymentOrder.mockRejectedValue(new Error("write failed"));

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to update payment order" });
    expect(mocks.grantProductAccess).not.toHaveBeenCalled();
  });

  it("updates order on non-success webhook without granting access", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    const existingOrder = buildExistingOrder();

    mocks.parseEventBody.mockReturnValue({
      order_id: existingOrder.orderId,
      transaction_status: "pending",
      status_code: null,
      gross_amount: null,
      payment_type: "bank_transfer"
    });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(existingOrder);
    mocks.normalizePaymentStatus.mockReturnValue("PENDING");
    mocks.savePaymentOrder.mockResolvedValue(undefined);

    const response = await handleWebhook(buildEvent());
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      message: "Webhook processed",
      orderId: existingOrder.orderId,
      status: "PENDING"
    });
    expect(mocks.grantProductAccess).not.toHaveBeenCalled();
    expect(mocks.savePaymentOrder).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining({
        orderId: existingOrder.orderId,
        status: "PENDING",
        transactionStatus: "pending",
        statusCode: "",
        grossAmount: "",
        paymentType: "bank_transfer"
      })
    );
  });

  it("grants access on first SUCCESS webhook and updates payment order", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    const existingOrder = buildExistingOrder();

    mocks.parseEventBody.mockReturnValue({
      order_id: existingOrder.orderId,
      transaction_status: "settlement",
      fraud_status: "accept",
      status_code: 200,
      gross_amount: 199999,
      payment_type: "gopay",
      transaction_id: "txn-123",
      transaction_time: "2026-05-13T10:00:00.000Z",
      settlement_time: "2026-05-13T10:01:00.000Z"
    });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(existingOrder);
    mocks.normalizePaymentStatus.mockReturnValue("SUCCESS");
    mocks.grantProductAccess.mockResolvedValue("2026-06-12T10:01:00.000Z");
    mocks.savePaymentOrder.mockResolvedValue(undefined);

    const response = await handleWebhook(buildEvent());
    const body = parseBody(response);

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      message: "Webhook processed",
      orderId: existingOrder.orderId,
      status: "SUCCESS"
    });

    expect(mocks.grantProductAccess).toHaveBeenCalledWith(
      "kjl-table",
      existingOrder,
      expect.any(String)
    );

    expect(mocks.savePaymentOrder).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining({
        orderId: existingOrder.orderId,
        status: "SUCCESS",
        statusCode: "200",
        grossAmount: "199999",
        fraudStatus: "accept",
        paymentType: "gopay",
        transactionId: "txn-123",
        transactionTime: "2026-05-13T10:00:00.000Z",
        settlementTime: "2026-05-13T10:01:00.000Z",
        accessGrantedAt: expect.any(String),
        expiryDate: "2026-06-12T10:01:00.000Z"
      })
    );
  });

  it("does not grant access when SUCCESS webhook arrives for an already granted order", async () => {
    const { handleWebhook, mocks } = await loadHandleWebhookModule();
    const existingOrder = buildExistingOrder({
      status: "SUCCESS",
      accessGrantedAt: "2026-05-12T00:00:00.000Z",
      expiryDate: "2026-06-11T00:00:00.000Z"
    });

    mocks.parseEventBody.mockReturnValue({
      order_id: existingOrder.orderId,
      transaction_status: "settlement",
      status_code: 200,
      gross_amount: 199999
    });
    mocks.validateWebhookSignature.mockReturnValue(true);
    mocks.readPaymentOrder.mockResolvedValue(existingOrder);
    mocks.normalizePaymentStatus.mockReturnValue("SUCCESS");
    mocks.savePaymentOrder.mockResolvedValue(undefined);

    const response = await handleWebhook(buildEvent());

    expect(response.statusCode).toBe(200);
    expect(mocks.grantProductAccess).not.toHaveBeenCalled();
    expect(mocks.savePaymentOrder).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining({
        orderId: existingOrder.orderId,
        status: "SUCCESS"
      })
    );
  });
});
