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

export interface Topic {
  id: string;
  title: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  title: string;
  type: 'quiz' | 'pdf' | 'audio' | 'images' | 'video';
}

export interface ProductDetail extends Product {
  description: string;
  topics: Topic[];
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
  id?: string;
  text: string;
}

export interface QuizQuestionRecord {
  id: string;
  text: string;
  options: QuizOptionRecord[];
  image?: string;
  audio?: string;
}

export type DynamoRecord = Record<string, unknown>;

export interface ProductMetadataRecord extends Product {
  PK: string;
  SK: string;
  entityType: "PRODUCT";
  description: string;
}

export interface TopicRecord {
  PK: string;
  SK: string;
  entityType: "TOPIC";
  productId: string;
  topicPartitionKey: string;
  topicOrder: number;
  id: string;
  title: string;
}

export interface SessionRecord {
  PK: string;
  SK: string;
  entityType: "SESSION";
  productId: string;
  topicId: string;
  sessionOrder: number;
  id: string;
  title: string;
  type: Session["type"];
  contentUrl?: string;
}