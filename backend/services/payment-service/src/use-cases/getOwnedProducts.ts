import { OwnedProduct } from "../models/ownedProduct";
import { UnauthorizedError, ForbiddenError } from "../errors/applicationErrors";
import { listOwnedProductsByUserId } from "../repositories/paymentOrderRepository";

export interface GetOwnedProductsInput {
  requestedUserId: string;
  authenticatedUserId?: string | null;
}

export const getOwnedProducts = async (
  input: GetOwnedProductsInput
): Promise<OwnedProduct[]> => {
  if (!input.authenticatedUserId) {
    throw new UnauthorizedError("Unauthorized");
  }

  if (input.authenticatedUserId !== input.requestedUserId) {
    throw new ForbiddenError("Forbidden");
  }

  return listOwnedProductsByUserId(input.requestedUserId);
};