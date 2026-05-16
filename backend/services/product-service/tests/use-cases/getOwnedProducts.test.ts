import { findOwnedProducts } from "../../src/repositories/findOwnedProducts";
import { getOwnedProducts } from "../../src/use-cases/getOwnedProducts";

jest.mock("../../src/repositories/findOwnedProducts", () => ({
  findOwnedProducts: jest.fn()
}));

describe("getOwnedProducts", () => {
  const findOwnedProductsMock = findOwnedProducts as jest.MockedFunction<typeof findOwnedProducts>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date("2026-05-16T00:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("returns only products whose accessExpiryDate is after today", async () => {
    findOwnedProductsMock.mockResolvedValue([
      {
        id: "purchase-active",
        productId: "prod-1",
        userId: "user-1",
        level: "N5",
        name: "JLPT N5",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        accessExpiryDate: "2026-05-17T00:00:00.000Z"
      },
      {
        id: "purchase-expired",
        productId: "prod-2",
        userId: "user-1",
        level: "N4",
        name: "JLPT N4",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        accessExpiryDate: "2026-05-15T23:59:59.000Z"
      },
      {
        id: "purchase-ended-today",
        productId: "prod-3",
        userId: "user-1",
        level: "N3",
        name: "JLPT N3",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        accessExpiryDate: "2026-05-16T00:00:00.000Z"
      }
    ]);

    await expect(
      getOwnedProducts({
        requestedUserId: "user-1",
        authenticatedUserId: "user-1"
      })
    ).resolves.toEqual([
      {
        id: "purchase-active",
        productId: "prod-1",
        userId: "user-1",
        level: "N5",
        name: "JLPT N5",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        accessExpiryDate: "2026-05-17T00:00:00.000Z"
      }
    ]);

    expect(findOwnedProductsMock).toHaveBeenCalledWith("user-1");
  });
});