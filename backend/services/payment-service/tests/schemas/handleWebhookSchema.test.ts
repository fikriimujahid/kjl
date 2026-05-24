import { readOrderIdFromWebhookPayload } from "../../src/schemas/handleWebhookSchema";

describe("readOrderIdFromWebhookPayload", () => {
  it("returns order_id when payload contains non-empty string", () => {
    expect(readOrderIdFromWebhookPayload({ order_id: "ORDER-1" })).toBe("ORDER-1");
  });

  it("keeps raw order_id value without trimming", () => {
    expect(readOrderIdFromWebhookPayload({ order_id: " ORDER-1 " })).toBe(" ORDER-1 ");
  });

  it.each([
    ["missing field", {}],
    ["empty string", { order_id: "" }],
    ["number", { order_id: 1 }],
    ["null", { order_id: null }]
  ])("returns null for %s", (_, payload) => {
    expect(readOrderIdFromWebhookPayload(payload as Record<string, unknown>)).toBeNull();
  });
});
