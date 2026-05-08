import { Product } from "../types/productTypes";
import { findPurchasedProductByUserAndProductId } from "../repositories/purchasedProductRepository";
import { getProductDetailsById } from "./productService";

const isAccessActive = (accessExpiryDate: string): boolean => {
  const accessExpiryDateValue = Date.parse(accessExpiryDate);

  if (Number.isNaN(accessExpiryDateValue)) {
    return false;
  }

  return accessExpiryDateValue > Date.now();
};

export type PurchasedProductDetailsResult =
  | { status: "ok"; product: Product }
  | { status: "purchase-not-found" }
  | { status: "purchase-expired" }
  | { status: "product-not-found" };

export const getPurchasedProductDetailsByUser = async (
  userId: string,
  productId: string
): Promise<PurchasedProductDetailsResult> => {
  const purchasedProduct = await findPurchasedProductByUserAndProductId(userId, productId);

  if (!purchasedProduct) {
    return { status: "purchase-not-found" };
  }

  if (!isAccessActive(purchasedProduct.accessExpiryDate)) {
    return { status: "purchase-expired" };
  }

  const product = await getProductDetailsById(productId);

  if (!product) {
    return { status: "product-not-found" };
  }

  return { status: "ok", product };
};