export interface SubmitQuizAnswerRecord {
  questionId: string;
  selectedOptionId: string;
}

export interface QuizAnswerKeyRecord {
  id: string;
  correctAnswer: string;
  score: number;
  explanation?: string;
}

export interface QuizQuestionScoreDetail {
  questionId: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  scoreAwarded: number;
  maxScore: number;
  explanation?: string;
}

export interface QuizScoreSummary {
  details: QuizQuestionScoreDetail[];
  obtainedScore: number;
  maxScore: number;
  percentage: number;
  answeredCount: number;
  totalQuestions: number;
}

export interface CatalogSession {
  id: string;
  passingScore?: number;
}

export interface CatalogTopic {
  id: string;
  sessions: CatalogSession[];
}

export interface CatalogProduct {
  id: string;
  passingScore?: number;
  topics: CatalogTopic[];
}
