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
  correctAnswer: string;
}

export interface Session {
  id: string;
  title: string;
  type: 'quiz' | 'pdf' | 'audio' | 'image' | 'video';
  contentUrl?: string;
  questions?: Question[];
}

export interface Topic {
  id: string;
  title: string;
  sessions: Session[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  shortDescription: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'JFT' | 'Beginner';
  topicsCount: number;
  featuredProducts?: boolean;
  topics: Topic[];
}

export interface PaymentHistory {
  id: string;
  productName: string;
  date: string;
  amount: number;
  status: 'Success' | 'Failed' | 'Pending';
}