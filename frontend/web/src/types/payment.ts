export type PaymentModalState =
  | { type: 'error'; message: string }
  | { type: 'already_owned'; productId: string }
  | null; 