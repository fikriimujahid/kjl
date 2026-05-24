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

export interface SessionAttemptFinishAnswerInput {
  questionId: string;
  selectedOptionId: string;
}

export interface SessionAttemptEvaluationDetail {
  questionId: string;
  selectedOptionId: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  awardedScore: number;
  explanation?: string;
}

export interface SessionAttemptEvaluation {
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  maxScore: number;
  obtainedScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
  details: SessionAttemptEvaluationDetail[];
}

export type SessionAttemptSessionType = "practice" | "exam";
export type SessionAttemptStatus = "ACTIVE" | "FINISHED";

export interface SessionAttemptProgressAnswer {
  option: string;
  optionId: string;
}

export interface SessionAttemptProgressCheckedAnswer {
  questionId: string;
  selectedOptionId: string;
  correctAnswer: string;
  isCorrect: boolean;
  score: number;
  awardedScore: number;
  explanation?: string;
}

export interface SessionAttemptRecord {
  PK: string;
  SK: string;
  entityType: "SESSION_ATTEMPT";
  attemptId: string;
  attemptNumber: number;
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  sessionType: SessionAttemptSessionType;
  status: SessionAttemptStatus;
  isActive: boolean;
  startedAt: string;
  finishedAt?: string;
  updatedAt: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  maxScore?: number;
  obtainedScore?: number;
  percentage?: number;
  passingScore?: number;
  passed?: boolean;
  durationSeconds?: number;
  progressCurrentQuestionIndex?: number;
  progressAnsweredQuestionIndexes?: number[];
  progressAnswers?: Record<string, SessionAttemptProgressAnswer>;
  progressCheckedAnswers?: Record<string, SessionAttemptProgressCheckedAnswer>;
  progressBookmarkedIndexes?: number[];
  progressDurationSeconds?: number;
  progressSavedAt?: string;
}

export interface SessionAttemptItem {
  attemptId: string;
  attemptNumber: number;
  status: SessionAttemptStatus;
  isActive: boolean;
  startedAt: string;
  finishedAt?: string;
  updatedAt: string;
  totalQuestions?: number;
  correctAnswers?: number;
  wrongAnswers?: number;
  maxScore?: number;
  obtainedScore?: number;
  percentage?: number;
  passingScore?: number;
  passed?: boolean;
  durationSeconds?: number;
  progressCurrentQuestionIndex?: number;
  progressAnsweredQuestionIndexes?: number[];
  progressAnswers?: Record<string, SessionAttemptProgressAnswer>;
  progressCheckedAnswers?: Record<string, SessionAttemptProgressCheckedAnswer>;
  progressBookmarkedIndexes?: number[];
  progressDurationSeconds?: number;
  progressSavedAt?: string;
}

export interface SessionAttemptHistoryResponse {
  productId: string;
  topicId: string;
  sessionId: string;
  sessionType: SessionAttemptSessionType;
  hasActiveAttempt: boolean;
  attempts: SessionAttemptItem[];
}

export interface StartSessionAttemptResponse extends SessionAttemptHistoryResponse {
  resumed: boolean;
  attempt: SessionAttemptItem;
}

export interface FinishSessionAttemptResponse extends SessionAttemptHistoryResponse {
  attempt: SessionAttemptItem;
  evaluation?: SessionAttemptEvaluation;
}

export interface GetSessionAttemptProgressResponse {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  savedAt: string;
  attempt: SessionAttemptItem;
}

export interface SaveSessionAttemptProgressResponse {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId: string;
  savedAt: string;
  attempt: SessionAttemptItem;
}
