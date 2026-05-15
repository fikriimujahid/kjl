import { PurchasedProductDetailsResult, getPurchasedProductDetailsByUser } from "../../src/services/purchasedProductService";
import { findPurchasedProductByUserAndProductId } from "../../src/repositories/purchasedProductRepository";
import { getProductDetailsById } from "../../src/services/productService";
import { ProductDetail } from "../../src/types/productTypes";

jest.mock("../../src/repositories/purchasedProductRepository", () => ({
  findPurchasedProductByUserAndProductId: jest.fn()
}));

jest.mock("../../src/services/productService", () => ({
  getProductDetailsById: jest.fn()
}));

describe("purchasedProductService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns purchase-not-found when user has no purchase for product", async () => {
    (findPurchasedProductByUserAndProductId as jest.Mock).mockResolvedValue(null);

    const result = await getPurchasedProductDetailsByUser("user-1", "prod-1");

    expect(findPurchasedProductByUserAndProductId).toHaveBeenCalledWith("user-1", "prod-1");
    expect(getProductDetailsById).not.toHaveBeenCalled();
    expect(result).toEqual<PurchasedProductDetailsResult>({
      status: "purchase-not-found"
    });
  });

  it("returns purchase-expired when accessExpiryDate is invalid", async () => {
    (findPurchasedProductByUserAndProductId as jest.Mock).mockResolvedValue({
      id: "purchase-1",
      productId: "prod-1",
      userId: "user-1",
      purchaseDate: "2026-01-01T00:00:00.000Z",
      accessExpiryDate: "not-a-date"
    });

    const result = await getPurchasedProductDetailsByUser("user-1", "prod-1");

    expect(getProductDetailsById).not.toHaveBeenCalled();
    expect(result).toEqual<PurchasedProductDetailsResult>({
      status: "purchase-expired"
    });
  });

  it("returns purchase-expired when access has passed current time", async () => {
    (findPurchasedProductByUserAndProductId as jest.Mock).mockResolvedValue({
      id: "purchase-1",
      productId: "prod-1",
      userId: "user-1",
      purchaseDate: "2026-01-01T00:00:00.000Z",
      accessExpiryDate: new Date(Date.now() - 60_000).toISOString()
    });

    const result = await getPurchasedProductDetailsByUser("user-1", "prod-1");

    expect(getProductDetailsById).not.toHaveBeenCalled();
    expect(result).toEqual<PurchasedProductDetailsResult>({
      status: "purchase-expired"
    });
  });

  it("returns product-not-found when purchase is active but product data is missing", async () => {
    (findPurchasedProductByUserAndProductId as jest.Mock).mockResolvedValue({
      id: "purchase-1",
      productId: "prod-1",
      userId: "user-1",
      purchaseDate: "2026-01-01T00:00:00.000Z",
      accessExpiryDate: new Date(Date.now() + 60_000).toISOString()
    });
    (getProductDetailsById as jest.Mock).mockResolvedValue(null);

    const result = await getPurchasedProductDetailsByUser("user-1", "prod-1");

    expect(getProductDetailsById).toHaveBeenCalledWith("prod-1");
    expect(result).toEqual<PurchasedProductDetailsResult>({
      status: "product-not-found"
    });
  });

  it("returns ok with product details when purchase is active and product exists", async () => {
    const product: ProductDetail = {
      id: "prod-1",
      name: "JLPT N5",
      price: 100000,
      shortDescription: "N5 package",
      level: "N5",
      topicsCount: 10,
      accessDurationDays: 30,
      description: "Detail description",
      topics: []
    };

    (findPurchasedProductByUserAndProductId as jest.Mock).mockResolvedValue({
      id: "purchase-1",
      productId: "prod-1",
      userId: "user-1",
      purchaseDate: "2026-01-01T00:00:00.000Z",
      accessExpiryDate: new Date(Date.now() + 60_000).toISOString()
    });
    (getProductDetailsById as jest.Mock).mockResolvedValue(product);

    const result = await getPurchasedProductDetailsByUser("user-1", "prod-1");

    expect(result).toEqual<PurchasedProductDetailsResult>({
      status: "ok",
      product
    });
  });
});
