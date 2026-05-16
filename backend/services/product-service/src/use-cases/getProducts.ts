import { Product } from "../types/productTypes";
import { findProducts } from "../repositories/findProducts";

export const getProducts = async (): Promise<Product[]> => {
  return findProducts();
};