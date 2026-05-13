import { createHash } from "crypto";
import { normalizePaymentStatus, validateWebhookSignature } from "../src/services/midtransService";

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