jest.mock("crypto", () => ({
  ...jest.requireActual("crypto"),
  randomUUID: jest.fn()
}));

import { randomUUID } from "crypto";
import { generatePaymentOrderId } from "../../src/domain/payment/generatePaymentOrderId";

describe("generatePaymentOrderId", () => {
  const randomUuidMock = randomUUID as jest.MockedFunction<typeof randomUUID>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds order id as KJL~<userId>~<base36Timestamp><firstRandomChar>", () => {
    jest.spyOn(Date, "now").mockReturnValue(1715550000000);
    randomUuidMock.mockReturnValue("a1234567-89ab-cdef-0123-456789abcdef");

    const orderId = generatePaymentOrderId("user-1");

    expect(orderId).toBe(`KJL~user-1~${(1715550000000).toString(36)}a`);
    expect(randomUuidMock).toHaveBeenCalledTimes(1);
  });

  it("strips hyphens before taking random suffix char", () => {
    jest.spyOn(Date, "now").mockReturnValue(1234);
    randomUuidMock.mockReturnValue("f---0000-0000-0000-0000-000000000000");

    const orderId = generatePaymentOrderId("user-2");

    expect(orderId.endsWith("f")).toBe(true);
  });
});
