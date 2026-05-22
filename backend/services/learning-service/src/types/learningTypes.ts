export type LearningSessionType = "quiz" | "practice" | "exam" | "pdf" | "audio" | "images" | "video";

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

export interface SessionQuestionOption {
  id: string;
  text: string;
}

export interface SessionQuestion {
  id: string;
  text: string;
  image?: string;
  audio?: string;
  options: SessionQuestionOption[];
}

export interface SessionQuestionContent {
  productId: string;
  topicId: string;
  sessionId: string;
  questions: SessionQuestion[];
}

export interface SessionAnswerKey {
  id: string;
  correctAnswer: string;
  score: number;
  explanation?: string;
}

export interface SessionSingleAnswerCheckResult {
  productId: string;
  topicId: string;
  sessionId: string;
  questionId: string;
  selectedOptionId: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  awardedScore: number;
  explanation?: string;
}
