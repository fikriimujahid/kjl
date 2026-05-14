import type {
  Product as BaseProduct,
  ProductDetail as BaseProductDetail,
  PurchasedProduct as BasePurchasedProduct,
  Session as BaseSession,
  SessionDetail as BaseSessionDetail,
  Topic as BaseTopic,
} from '@/lib/types';

export type Product = BaseProduct;
export type ProductDetail = BaseProductDetail;
export type PurchasedProduct = BasePurchasedProduct;
export type Session = BaseSession;
export type SessionDetail = BaseSessionDetail;
export type Topic = BaseTopic;

export type PaymentModalState =
  | { type: 'error'; message: string }
  | { type: 'already_owned'; productId: string }
  | null;