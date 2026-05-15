import { createPaymentSchema } from "../../src/schemas/createPaymentSchema";

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
});
