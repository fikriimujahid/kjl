import { getPaymentServiceEnv } from "../../config/env";
import { Product } from "../../models/product";
import { AuthenticatedUser } from "@shared-utils/auth";

interface BuildSnapPayloadInput {
  orderId: string;
  amount: number;
  product: Product;
  authenticatedUser: AuthenticatedUser;
}

export const buildSnapPayload = (input: BuildSnapPayloadInput): Record<string, unknown> => {
  const env = getPaymentServiceEnv();
  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.amount
    },
    item_details: [
      {
        id: input.product.id,
        name: input.product.name,
        price: input.amount,
        quantity: 1
      }
    ],
    customer_details: {
      first_name:
        input.authenticatedUser.name || input.authenticatedUser.email || input.authenticatedUser.id,
      email: input.authenticatedUser.email || undefined
    }
  };

  payload.callbacks = {
    finish: `${env.APP_BASE_URL}/payment-success`,
    error: `${env.APP_BASE_URL}/payment-failed`,
    pending: `${env.APP_BASE_URL}/payment-success?pending=1`
  };

  return payload;
};