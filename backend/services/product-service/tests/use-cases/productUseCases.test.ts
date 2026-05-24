import {
  findOwnedProducts,
  findProductDetailsById,
  findProducts
} from "../../src/repositories/productRepository";
import {
  AuthenticationRequiredError,
  ForbiddenProductAccessError,
  ProductNotFoundError
} from "../../src/errors/applicationErrors";
import { getOwnedProducts } from "../../src/use-cases/getOwnedProducts";
import { getProductDetails } from "../../src/use-cases/getProductDetails";
import { getProducts } from "../../src/use-cases/getProducts";
import { ProductDetail } from "../../src/types/productTypes";

jest.mock("../../src/repositories/productRepository", () => ({
  findProducts: jest.fn(),
  findProductDetailsById: jest.fn(),
  findOwnedProducts: jest.fn()
}));

describe("product use cases", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getProducts delegates to the repository", async () => {
    const products = [
      {
        id: "prod-1",
        name: "JLPT N5",
        price: 100000,
        shortDescription: "N5 package",
        level: "N5" as const,
        topicsCount: 10,
        accessDurationDays: 30
      }
    ];

    (findProducts as jest.MockedFunction<typeof findProducts>).mockResolvedValue(products);

    await expect(getProducts()).resolves.toEqual(products);
    expect(findProducts).toHaveBeenCalledTimes(1);
  });

  it("getProductDetails returns repository data when a product exists", async () => {
    const productDetail: ProductDetail = {
      id: "prod-1",
      name: "JLPT N5",
      price: 100000,
      shortDescription: "N5 package",
      level: "N5",
      topicsCount: 10,
      accessDurationDays: 30,
      description: "Complete N5 preparation",
      topics: []
    };

    (findProductDetailsById as jest.MockedFunction<typeof findProductDetailsById>).mockResolvedValue(
      productDetail
    );

    await expect(getProductDetails("prod-1")).resolves.toEqual(productDetail);
    expect(findProductDetailsById).toHaveBeenCalledWith("prod-1");
  });

  it("getProductDetails throws ProductNotFoundError when the repository returns null", async () => {
    (findProductDetailsById as jest.MockedFunction<typeof findProductDetailsById>).mockResolvedValue(
      null
    );

    await expect(getProductDetails("missing-product")).rejects.toBeInstanceOf(ProductNotFoundError);
    expect(findProductDetailsById).toHaveBeenCalledWith("missing-product");
  });

  it("getOwnedProducts throws AuthenticationRequiredError when no user is authenticated", async () => {
    await expect(
      getOwnedProducts({
        requestedUserId: "user-1",
        authenticatedUserId: undefined
      })
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);

    expect(findOwnedProducts).not.toHaveBeenCalled();
  });

  it("getOwnedProducts throws ForbiddenProductAccessError when the user ids do not match", async () => {
    await expect(
      getOwnedProducts({
        requestedUserId: "user-1",
        authenticatedUserId: "user-2"
      })
    ).rejects.toBeInstanceOf(ForbiddenProductAccessError);

    expect(findOwnedProducts).not.toHaveBeenCalled();
  });

  it("getOwnedProducts delegates to the repository when access is allowed", async () => {
    const ownedProducts = [
      {
        id: "purchase-1",
        productId: "prod-1",
        userId: "user-1",
        level: "N5",
        name: "JLPT N5",
        purchaseDate: "2026-01-01T00:00:00.000Z",
        accessExpiryDate: "2026-12-31T00:00:00.000Z"
      }
    ];

    (findOwnedProducts as jest.MockedFunction<typeof findOwnedProducts>).mockResolvedValue(
      ownedProducts
    );

    await expect(
      getOwnedProducts({
        requestedUserId: "user-1",
        authenticatedUserId: "user-1"
      })
    ).resolves.toEqual(ownedProducts);

    expect(findOwnedProducts).toHaveBeenCalledWith("user-1");
  });
});