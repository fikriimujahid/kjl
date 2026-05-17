import {
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
  ValidationError
} from "../../src/errors/applicationErrors";
import { handleWebhook } from "../../src/use-cases/handleWebhook";
import { readOrderIdFromWebhookPayload } from "../../src/schemas/handleWebhookSchema";
import { normalizePaymentStatus, validateWebhookSignature } from "../../src/services/midtransService";
import {
  findPaymentOrderById,
  grantProductAccess,
  savePaymentOrder
} from "../../src/repositories/paymentOrderRepository";

jest.mock("../../src/schemas/handleWebhookSchema", () => ({
  readOrderIdFromWebhookPayload: jest.fn()
}));

jest.mock("../../src/services/midtransService", () => ({
  validateWebhookSignature: jest.fn(),
  normalizePaymentStatus: jest.fn()
}));

jest.mock("../../src/repositories/paymentOrderRepository", () => ({
  findPaymentOrderById: jest.fn(),
  grantProductAccess: jest.fn(),
  savePaymentOrder: jest.fn()
}));

describe("handleWebhook", () => {
  const validateWebhookSignatureMock = validateWebhookSignature as jest.MockedFunction<typeof validateWebhookSignature>;
  const normalizePaymentStatusMock = normalizePaymentStatus as jest.MockedFunction<typeof normalizePaymentStatus>;
  const readOrderIdFromWebhookPayloadMock =
    readOrderIdFromWebhookPayload as jest.MockedFunction<typeof readOrderIdFromWebhookPayload>;
  const findPaymentOrderByIdMock = findPaymentOrderById as jest.MockedFunction<typeof findPaymentOrderById>;
  const grantProductAccessMock = grantProductAccess as jest.MockedFunction<typeof grantProductAccess>;
  const savePaymentOrderMock = savePaymentOrder as jest.MockedFunction<typeof savePaymentOrder>;

  const existingOrder = {
    PK: "PAYMENT#user-1",
    SK: "PAYMENT#KJL~user-1~abc123",
    entityType: "PAYMENT_ORDER" as const,
    orderId: "KJL~user-1~abc123",
    userId: "user-1",
    productId: "product-1",
    productName: "Starter",
    amount: 199999,
    grossAmount: "199999.00",
    accessDurationDays: 30,
    snapRedirectUrl: "https://pay.example/redirect",
    status: "CREATED" as const,
    paymentProvider: "MIDTRANS" as const,
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z"
  };

  const input = {
    env: {
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://snap.midtrans.test",
      APP_BASE_URL: "",
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test",
      INTERNAL_SERVICE_API_KEY: "internal-secret"
    },
    payload: {
      order_id: "KJL~user-1~abc123",
      transaction_status: "settlement",
      status_code: 200,
      gross_amount: 199999,
      fraud_status: "accept",
      payment_type: "gopay",
      transaction_id: "txn-1",
      transaction_time: "2026-05-15T00:00:00.000Z",
      settlement_time: "2026-05-15T00:01:00.000Z"
    } as Record<string, unknown>
  };

  beforeEach(() => {
    jest.clearAllMocks();

    validateWebhookSignatureMock.mockReturnValue(true);
    readOrderIdFromWebhookPayloadMock.mockReturnValue("KJL~user-1~abc123");
    findPaymentOrderByIdMock.mockResolvedValue(existingOrder);
    normalizePaymentStatusMock.mockReturnValue("SUCCESS");
    grantProductAccessMock.mockResolvedValue("2026-06-14T00:00:00.000Z");
    savePaymentOrderMock.mockResolvedValue(undefined);
  });

  it("throws UnauthorizedError when Midtrans signature is invalid", async () => {
    validateWebhookSignatureMock.mockReturnValue(false);

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Invalid Midtrans signature",
      statusCode: 401
    });

    expect(findPaymentOrderByIdMock).not.toHaveBeenCalled();
  });

  it("throws ValidationError when order_id is missing", async () => {
    readOrderIdFromWebhookPayloadMock.mockReturnValue(null);

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(ValidationError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Missing order_id",
      statusCode: 400
    });
  });

  it("throws ExternalServiceError when reading payment order fails", async () => {
    findPaymentOrderByIdMock.mockRejectedValue(new Error("dynamo down"));

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Failed to read payment order",
      statusCode: 502
    });
  });

  it("throws NotFoundError when payment order does not exist", async () => {
    findPaymentOrderByIdMock.mockResolvedValue(null);

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Payment order not found",
      statusCode: 404
    });
  });

  it("throws ExternalServiceError when granting access fails for first SUCCESS status", async () => {
    normalizePaymentStatusMock.mockReturnValue("SUCCESS");
    grantProductAccessMock.mockRejectedValue(new Error("grant failed"));

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Failed to grant product access",
      statusCode: 502
    });
  });

  it("throws ExternalServiceError when payment order update fails", async () => {
    savePaymentOrderMock.mockRejectedValue(new Error("write failed"));

    await expect(handleWebhook(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(handleWebhook(input)).rejects.toMatchObject({
      message: "Failed to update payment order",
      statusCode: 502
    });
  });

  it("grants product access on first SUCCESS and persists enriched payment order", async () => {
    const result = await handleWebhook(input);

    expect(grantProductAccessMock).toHaveBeenCalledWith(
      "kjl-table",
      existingOrder,
      expect.any(String)
    );

    expect(savePaymentOrderMock).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining({
        orderId: existingOrder.orderId,
        status: "SUCCESS",
        statusCode: "200",
        grossAmount: "199999",
        fraudStatus: "accept",
        paymentType: "gopay",
        transactionId: "txn-1",
        transactionTime: "2026-05-15T00:00:00.000Z",
        settlementTime: "2026-05-15T00:01:00.000Z",
        accessGrantedAt: expect.any(String),
        expiryDate: "2026-06-14T00:00:00.000Z"
      })
    );

    expect(result).toEqual({
      orderId: "KJL~user-1~abc123",
      status: "SUCCESS"
    });
  });

  it("does not grant product access when SUCCESS already granted previously", async () => {
    normalizePaymentStatusMock.mockReturnValue("SUCCESS");
    findPaymentOrderByIdMock.mockResolvedValue({
      ...existingOrder,
      accessGrantedAt: "2026-05-01T00:00:00.000Z",
      expiryDate: "2026-05-31T00:00:00.000Z"
    });

    const result = await handleWebhook(input);

    expect(grantProductAccessMock).not.toHaveBeenCalled();
    expect(savePaymentOrderMock).toHaveBeenCalled();
    expect(result.status).toBe("SUCCESS");
  });

  it("persists non-success status without access grant and normalizes nullable fields", async () => {
    normalizePaymentStatusMock.mockReturnValue("PENDING");

    const pendingInput = {
      ...input,
      payload: {
        order_id: "KJL~user-1~abc123",
        transaction_status: "pending",
        status_code: null,
        gross_amount: null,
        payment_type: "bank_transfer"
      }
    };

    const result = await handleWebhook(pendingInput);

    expect(grantProductAccessMock).not.toHaveBeenCalled();
    expect(savePaymentOrderMock).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining({
        status: "PENDING",
        transactionStatus: "pending",
        statusCode: "",
        grossAmount: "",
        paymentType: "bank_transfer"
      })
    );
    expect(result).toEqual({
      orderId: "KJL~user-1~abc123",
      status: "PENDING"
    });
  });
});
