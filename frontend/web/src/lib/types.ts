export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  description: string;
  topicsCount: number;
  questionsCount: number;
  accessType: "lifetime" | "subscription";
  category: string;
  badge?: string;
}

export interface Topic {
  id: string;
  productId: string;
  name: string;
  slug: string;
  sessionsCount: number;
  description?: string;
}

export interface Session {
  id: string;
  topicId: string;
  productId: string;
  name: string;
  slug: string;
  questionCount: number;
  type: "quiz" | "material";
}

export interface Question {
  questionId: string;
  questionText: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  options: string[];
  correctAnswer: string;
}

export interface QuizData {
  productId: string;
  topicSlug: string;
  sessionSlug: string;
  questions: Question[];
}

export interface Payment {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  status: "pending" | "success" | "failed";
  createdAt: string;
}
