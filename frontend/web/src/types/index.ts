
export interface User {
  id: string;
  email: string;
  displayName: string;
  purchasedProductIds: string[];
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  image?: string;
  audio?: string;
  options: string[];
  optionIds?: string[];
  correctAnswer: string;
}



export interface SessionDetail {
  id: string;
  text?: string;
  contentUrl?: string;
  optionIds?: string[];
  options?: string[];
  image?: string;
  audio?: string;
}





export interface PaymentHistory {
  id: string;
  productName: string;
  date: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Pending';
}

export interface PurchasedProduct {
  id: string;
  productId: string;
  userId: string;
  purchaseDate: string;
  accessExpiryDate: string;
}