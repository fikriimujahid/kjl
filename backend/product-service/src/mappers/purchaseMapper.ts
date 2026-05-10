import { PurchaseRecord, PurchasedProduct } from "../types/productTypes";

export const mapPurchaseRecordToPurchasedProduct = (
  record: PurchaseRecord
): PurchasedProduct => {
  const derivedId = record.SK.startsWith("PURCHASE#")
    ? record.SK.slice("PURCHASE#".length)
    : record.SK;

  return {
    id: record.purchaseId ?? derivedId,
    productId: record.productId,
    userId: record.userId,
    purchaseDate: record.purchaseDate,
    accessExpiryDate: record.expiryDate
  };
};
