import { PurchaseRecord } from "../types/productServiceTypes";

export const parseDateValue = (value: string): number => {
  const parsed = Date.parse(value);

  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return parsed;
};

export const isPurchaseActive = (purchase: PurchaseRecord): boolean => {
  const expiryTime = parseDateValue(purchase.expiryDate);

  if (Number.isNaN(expiryTime)) {
    return false;
  }

  return expiryTime > Date.now();
};
