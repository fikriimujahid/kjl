import { createHash } from "crypto";
import {
  createSnapTransaction,
  normalizePaymentStatus,
  validateWebhookSignature
} from "../src/services/midtransService";

const buildSignature = (
  orderId: string,
  statusCode: string,
  grossAmount: string,
  serverKey: string
): string => {
  return createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
    .digest("hex");
};

describe("createSnapTransaction", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "info").mockImplementation(() => undefined);
    jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    Object.defineProperty(global, "fetch", {
      value: originalFetch,
      writable: true
    });
    jest.restoreAllMocks();
  });

  it("creates Midtrans transaction and returns token with redirect URL", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      statusText: "Created",
      text: async () => JSON.stringify({ token: "snap-token", redirect_url: "https://pay.example/redirect" })
    });

    Object.defineProperty(global, "fetch", {
      value: fetchMock,
      writable: true
    });

    const result = await createSnapTransaction({
      serverKey: "midtrans-key",
      snapApiUrl: "https://snap.midtrans.test/transactions",
      payload: { transaction_details: { order_id: "ORDER-1", gross_amount: 10000 } }
    });

    expect(fetchMock).toHaveBeenCalledWith("https://snap.midtrans.test/transactions", {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from("midtrans-key:").toString("base64")}`,
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({ transaction_details: { order_id: "ORDER-1", gross_amount: 10000 } })
    });

    expect(result).toEqual({
      token: "snap-token",
      redirectUrl: "https://pay.example/redirect"
    });
  });

  it("returns null redirectUrl when Midtrans response does not contain redirect_url", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ token: "snap-token" })
    });

    Object.defineProperty(global, "fetch", {
      value: fetchMock,
      writable: true
    });

    const result = await createSnapTransaction({
      serverKey: "midtrans-key",
      snapApiUrl: "https://snap.midtrans.test/transactions",
      payload: { test: true }
    });

    expect(result).toEqual({
      token: "snap-token",
      redirectUrl: null
    });
  });

  it("throws when Midtrans returns non-success status", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      text: async () => JSON.stringify({ error_messages: ["unauthorized"] })
    });

    Object.defineProperty(global, "fetch", {
      value: fetchMock,
      writable: true
    });

    await expect(
      createSnapTransaction({
        serverKey: "midtrans-key",
        snapApiUrl: "https://snap.midtrans.test/transactions",
        payload: { test: true }
      })
    ).rejects.toThrow("Midtrans rejected payment creation with status 401");
  });

  it("throws when Midtrans response payload is not an object", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "not-json-object"
    });

    Object.defineProperty(global, "fetch", {
      value: fetchMock,
      writable: true
    });

    await expect(
      createSnapTransaction({
        serverKey: "midtrans-key",
        snapApiUrl: "https://snap.midtrans.test/transactions",
        payload: { test: true }
      })
    ).rejects.toThrow("Midtrans Snap response payload is not a valid object");
  });

  it("throws when Midtrans does not return snap token", async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => JSON.stringify({ redirect_url: "https://pay.example/redirect" })
    });

    Object.defineProperty(global, "fetch", {
      value: fetchMock,
      writable: true
    });

    await expect(
      createSnapTransaction({
        serverKey: "midtrans-key",
        snapApiUrl: "https://snap.midtrans.test/transactions",
        payload: { test: true }
      })
    ).rejects.toThrow("Midtrans Snap token was not returned");
  });
});

describe("validateWebhookSignature", () => {
  const serverKey = "SB-Mid-server-example";

  it("returns true for valid Midtrans signature formula with string fields", () => {
    const payload = {
      order_id: "ORDER-123",
      status_code: "200",
      gross_amount: "10000.00"
    };

    const signatureKey = buildSignature(
      payload.order_id,
      payload.status_code,
      payload.gross_amount,
      serverKey
    );

    expect(
      validateWebhookSignature(
        {
          ...payload,
          signature_key: signatureKey
        },
        serverKey
      )
    ).toBe(true);
  });

  it("accepts uppercase signature_key", () => {
    const signatureKey = buildSignature("ORDER-999", "200", "10000.00", serverKey).toUpperCase();

    expect(
      validateWebhookSignature(
        {
          order_id: "ORDER-999",
          status_code: "200",
          gross_amount: "10000.00",
          signature_key: signatureKey
        },
        serverKey
      )
    ).toBe(true);
  });

  it("accepts numeric status_code and gross_amount representations", () => {
    const signatureKey = buildSignature("ORDER-456", "200", "199999", serverKey);

    expect(
      validateWebhookSignature(
        {
          order_id: "ORDER-456",
          status_code: 200,
          gross_amount: 199999,
          signature_key: signatureKey
        },
        serverKey
      )
    ).toBe(true);
  });

  it("returns false when signature does not match", () => {
    expect(
      validateWebhookSignature(
        {
          order_id: "ORDER-789",
          status_code: "200",
          gross_amount: "10000.00",
          signature_key: "invalid"
        },
        serverKey
      )
    ).toBe(false);
  });

  it("returns false when required signature fields are missing", () => {
    expect(validateWebhookSignature({ order_id: "ORDER-1" }, serverKey)).toBe(false);
    expect(
      validateWebhookSignature(
        {
          order_id: "ORDER-1",
          signature_key: "abc",
          status_code: "200"
        },
        serverKey
      )
    ).toBe(false);
  });
});

describe("normalizePaymentStatus", () => {
  it("returns SUCCESS for capture with fraud accept (credit card)", () => {
    expect(normalizePaymentStatus("capture", "accept")).toBe("SUCCESS");
  });

  it("returns PENDING_REVIEW for capture with fraud challenge (credit card)", () => {
    expect(normalizePaymentStatus("capture", "challenge")).toBe("PENDING_REVIEW");
  });

  it("returns SUCCESS for settlement (bank transfer/e-wallet/cstore/akulaku)", () => {
    expect(normalizePaymentStatus("settlement", null)).toBe("SUCCESS");
  });

  it("returns PENDING for pending and authorize", () => {
    expect(normalizePaymentStatus("pending", null)).toBe("PENDING");
    expect(normalizePaymentStatus("authorize", null)).toBe("PENDING");
  });

  it("returns FAILED for deny/cancel/expire/failure", () => {
    expect(normalizePaymentStatus("deny", null)).toBe("FAILED");
    expect(normalizePaymentStatus("cancel", null)).toBe("FAILED");
    expect(normalizePaymentStatus("expire", null)).toBe("FAILED");
    expect(normalizePaymentStatus("failure", null)).toBe("FAILED");
  });

  it("returns REFUNDED for refund family statuses", () => {
    expect(normalizePaymentStatus("refund", null)).toBe("REFUNDED");
    expect(normalizePaymentStatus("partial_refund", null)).toBe("REFUNDED");
    expect(normalizePaymentStatus("chargeback", null)).toBe("REFUNDED");
    expect(normalizePaymentStatus("partial_chargeback", null)).toBe("REFUNDED");
  });
});