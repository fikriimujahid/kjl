import { Product } from "../../models/product";
import { AuthenticatedUser } from "../../utils/auth";

interface BuildSnapPayloadInput {
  orderId: string;
  amount: number;
  product: Product;
  authenticatedUser: AuthenticatedUser;
  appBaseUrl: string;
}

export const buildSnapPayload = (input: BuildSnapPayloadInput): Record<string, unknown> => {
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

  if (input.appBaseUrl) {
    payload.callbacks = {
      finish: `${input.appBaseUrl}/payment-success`,
      error: `${input.appBaseUrl}/payment-failed`,
      pending: `${input.appBaseUrl}/payment-success?pending=1`
    };
  }

  return payload;
};