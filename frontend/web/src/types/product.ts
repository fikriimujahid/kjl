export interface Product {
  id: string;
  name: string;
  price: number;
  normalPrice?: number;
  shortDescription: string;
  level: string;
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
  topicId: string;
  contentUrl: string;
  title: string;
  type: 'practice' | 'pdf' | 'audio' | 'images' | 'video' | 'exam';
  passingScore?: number;
  duration?: number;
}

export interface OwnedProduct {
  id: string;
  productId: string;
  userId: string;
  level: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
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