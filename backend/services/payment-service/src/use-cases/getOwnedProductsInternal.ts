import { OwnedProduct } from "../models/ownedProduct";
import { listOwnedProductsByUserId } from "../repositories/paymentOrderRepository";

export interface GetOwnedProductsInternalInput {
  requestedUserId: string;
}

export const getOwnedProductsInternal = async (
  input: GetOwnedProductsInternalInput
): Promise<OwnedProduct[]> => {
  return listOwnedProductsByUserId(input.requestedUserId);
};