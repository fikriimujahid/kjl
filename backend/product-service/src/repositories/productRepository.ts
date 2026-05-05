import { Product } from "../models/product";
import { isProduct } from "../utils/validators";

const PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(PRODUCT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch product data: ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Invalid product payload format");
  }

  return payload.filter(isProduct);
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const products = await fetchProducts();
  const product = products.find((item) => item.id === id);
  return product ?? null;
};
