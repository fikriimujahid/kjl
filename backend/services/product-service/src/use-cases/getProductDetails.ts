import { ProductDetail } from "../types/productTypes";
import { findProductDetailsById } from "../repositories/findProductDetailsById";
import { ProductNotFoundError } from "../errors/applicationErrors";

export const getProductDetails = async (
  productId: string
): Promise<ProductDetail> => {
  const productDetails = await findProductDetailsById(productId);

  if (!productDetails) {
    throw new ProductNotFoundError();
  }

  return productDetails;
};