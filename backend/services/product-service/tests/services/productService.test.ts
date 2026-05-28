import { findProductDetailsById, findProducts } from "../../src/repositories/productRepository";
import { getProductDetailsById, getProducts } from "../../src/services/productService";

jest.mock("../../src/repositories/productRepository", () => ({
  findProducts: jest.fn(),
  findProductDetailsById: jest.fn()
}));

describe("productService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getProducts delegates to repository and returns product list", async () => {
    const products = [
      {
        id: "prod-1",
        name: "JLPT N5",
        price: 100000,
        shortDescription: "N5 package",
        level: "N5",
        topicsCount: 10,
        accessDurationDays: 30
      }
    ];

    (findProducts as jest.Mock).mockResolvedValue(products);

    const result = await getProducts();

    expect(findProducts).toHaveBeenCalledTimes(1);
    expect(result).toEqual(products);
  });

  it("getProductDetailsById delegates with id and returns detail", async () => {
    const productDetail = {
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

    (findProductDetailsById as jest.Mock).mockResolvedValue(productDetail);

    const result = await getProductDetailsById("prod-1");

    expect(findProductDetailsById).toHaveBeenCalledWith("prod-1");
    expect(result).toEqual(productDetail);
  });

  it("getProductDetailsById returns null when repository does not find data", async () => {
    (findProductDetailsById as jest.Mock).mockResolvedValue(null);

    const result = await getProductDetailsById("missing-product");

    expect(findProductDetailsById).toHaveBeenCalledWith("missing-product");
    expect(result).toBeNull();
  });
});
