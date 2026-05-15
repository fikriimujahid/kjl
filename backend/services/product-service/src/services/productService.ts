import { Product, ProductDetail, OwnedProduct, Session, SessionDetail, Topic } from "../types/productTypes";
import { findProducts, findProductDetailsById, findOwnedProducts } from "../repositories/productRepository";

export const getProducts = async (): Promise<Product[]> => {
  return findProducts();
};

export const getProductDetailsById = async (id: string): Promise<ProductDetail | null> => {
  return findProductDetailsById(id);
};

export const getOwnedProducts = async (
  userId: string
): Promise<OwnedProduct[]> => {
  return findOwnedProducts(userId);
};