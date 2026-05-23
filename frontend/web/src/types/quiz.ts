export type QuizMode = 'exam' | 'practice';

export interface SelectedAnswer {
  option: string;
  optionId: string;
}

export interface QuizResultDetail {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  score: number;
  awardedScore: number;
}

export interface QuizResult {
  details: QuizResultDetail[];
  totalQuestions: number;
  maxScore: number;
  obtainedScore: number;
  percentage: number;
  passingScore: number;
  passed: boolean;
}
