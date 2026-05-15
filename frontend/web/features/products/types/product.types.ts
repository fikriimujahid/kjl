export interface Product {
  id: string;
  name: string;
  price: number;
  shortDescription: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'JFT' | 'Beginner';
  topicsCount: number;
  featuredProducts?: boolean;
  accessDurationDays: number;
}

export interface ProductDetail extends Product {
  description: string;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  title: string;
  type: 'quiz' | 'pdf' | 'audio' | 'images' | 'video';
  contentUrl?: string;
  topicId?: string;
  questions?: Question[];
}

export interface OwnedProduct {
  id: string;
  productId: string;
  level: string;
  name: string;
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

export interface PurchasedProduct {
  id: string;
  productId: string;
  userId: string;
  purchaseDate: string;
  accessExpiryDate: string;
}

export type PaymentModalState =
  | { type: 'error'; message: string }
  | { type: 'already_owned'; productId: string }
  | null; 