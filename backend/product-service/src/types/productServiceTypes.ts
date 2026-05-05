export interface PurchaseRecord {
  PK: string;
  SK: string;
  entityType: "PURCHASE";
  userId: string;
  productId: string;
  purchaseId?: string;
  purchaseDate: string;
  expiryDate: string;
}

export interface QuizOptionRecord {
  text: string;
}

export interface QuizQuestionRecord {
  id: string;
  text: string;
  options: QuizOptionRecord[];
  image?: string;
  audio?: string;
}
