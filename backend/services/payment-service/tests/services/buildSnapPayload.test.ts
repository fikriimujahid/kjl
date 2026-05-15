import { buildSnapPayload } from "../../src/services/midtrans/buildSnapPayload";

describe("buildSnapPayload", () => {
  const baseInput = {
    orderId: "KJL~user-1~abc123",
    amount: 199999,
    product: {
      id: "product-1",
      name: "Starter",
      price: 199999,
      accessDurationDays: 30
    },
    authenticatedUser: {
      id: "user-1",
      email: "user@example.com",
      name: "Demo User"
    },
    appBaseUrl: "https://app.kjl.test"
  };

  it("builds Midtrans payload with transaction, item, customer and callbacks", () => {
    const payload = buildSnapPayload(baseInput) as Record<string, unknown>;

    expect(payload).toEqual({
      transaction_details: {
        order_id: "KJL~user-1~abc123",
        gross_amount: 199999
      },
      item_details: [
        {
          id: "product-1",
          name: "Starter",
          price: 199999,
          quantity: 1
        }
      ],
      customer_details: {
        first_name: "Demo User",
        email: "user@example.com"
      },
      callbacks: {
        finish: "https://app.kjl.test/payment-success",
        error: "https://app.kjl.test/payment-failed",
        pending: "https://app.kjl.test/payment-success?pending=1"
      }
    });
  });

  it("falls back to email then id for first_name", () => {
    const payloadWithEmailFallback = buildSnapPayload({
      ...baseInput,
      authenticatedUser: { id: "user-1", email: "user@example.com", name: "" }
    }) as Record<string, unknown>;

    expect((payloadWithEmailFallback.customer_details as Record<string, unknown>).first_name).toBe(
      "user@example.com"
    );

    const payloadWithIdFallback = buildSnapPayload({
      ...baseInput,
      authenticatedUser: { id: "user-1", email: "", name: "" }
    }) as Record<string, unknown>;

    expect((payloadWithIdFallback.customer_details as Record<string, unknown>).first_name).toBe("user-1");
    expect((payloadWithIdFallback.customer_details as Record<string, unknown>).email).toBeUndefined();
  });

  it("does not add callbacks when appBaseUrl is empty", () => {
    const payload = buildSnapPayload({
      ...baseInput,
      appBaseUrl: ""
    }) as Record<string, unknown>;

    expect(payload.callbacks).toBeUndefined();
  });
});
