export interface Product {
  id: string;
  name: string;
  price: number;
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
  title: string;
  type: 'practice' | 'pdf' | 'audio' | 'images' | 'video' | 'exam';
  passingScore?: number;
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
  passingScore?: number;
}