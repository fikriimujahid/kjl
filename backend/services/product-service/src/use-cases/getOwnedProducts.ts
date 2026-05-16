import { OwnedProduct } from "../types/productTypes";
import { findOwnedProducts } from "../repositories/findOwnedProducts";
import {
  AuthenticationRequiredError,
  ForbiddenProductAccessError
} from "../errors/applicationErrors";

export interface GetOwnedProductsInput {
  requestedUserId: string;
  authenticatedUserId?: string | null;
}

export const getOwnedProducts = async (
  input: GetOwnedProductsInput
): Promise<OwnedProduct[]> => {
  if (!input.authenticatedUserId) {
    throw new AuthenticationRequiredError();
  }

  if (input.authenticatedUserId !== input.requestedUserId) {
    throw new ForbiddenProductAccessError();
  }

  return findOwnedProducts(input.requestedUserId);
};