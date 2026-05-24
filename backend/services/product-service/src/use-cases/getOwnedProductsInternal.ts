import { OwnedProduct } from "../types/productTypes";
import { findOwnedProducts } from "../repositories/findOwnedProducts";

export interface GetOwnedProductsInternalInput {
  requestedUserId: string;
}

export const getOwnedProductsInternal = async (
  input: GetOwnedProductsInternalInput
): Promise<OwnedProduct[]> => {
  return findOwnedProducts(input.requestedUserId);
};
