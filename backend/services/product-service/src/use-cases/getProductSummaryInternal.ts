import { findProductSummarysById } from "../repositories/findProductSummarysById";
import { Product } from "../types/productTypes";

export interface GetProductSummaryInternalInput {
  productId: string;
}

export const getProductSummaryInternal = async (
  input: GetProductSummaryInternalInput
): Promise<Product> => {
  return findProductSummarysById(input.productId);
};
  