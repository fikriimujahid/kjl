export type LearningSessionType = "quiz" | "pdf" | "audio" | "images" | "video";

export interface OwnedProduct {
  id: string;
  productId: string;
  userId: string;
  level: string;
  name: string;
  purchaseDate: string;
  expiryDate: string;
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
  type: LearningSessionType;
  contentUrl?: string;
}

export interface SessionImageContent {
  productId: string;
  topicId: string;
  sessionId: string;
  images: string[];
}
