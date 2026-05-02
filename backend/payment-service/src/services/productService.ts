import { isProduct, Product } from "../models/product";

export const fetchProductById = async (
  productId: string,
  productDataUrl: string
): Promise<Product | null> => {
  const response = await fetch(productDataUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch product data: ${response.status}`);
  }

  const payload = (await response.json()) as unknown;

  if (!Array.isArray(payload)) {
    throw new Error("Invalid product payload format");
  }

  const product = payload.filter(isProduct).find((item) => item.id === productId);
  return product ?? null;
};
