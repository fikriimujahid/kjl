import { SessionAttemptItem, SessionAttemptRecord } from "../types/learningTypes";

export const mapAttemptItem = (attempt: SessionAttemptRecord): SessionAttemptItem => ({
  attemptId: attempt.attemptId,
  attemptNumber: attempt.attemptNumber,
  status: attempt.status,
  isActive: attempt.isActive,
  startedAt: attempt.startedAt,
  finishedAt: attempt.finishedAt,
  updatedAt: attempt.updatedAt,
  totalQuestions: attempt.totalQuestions,
  correctAnswers: attempt.correctAnswers,
  maxScore: attempt.maxScore,
  obtainedScore: attempt.obtainedScore,
  percentage: attempt.percentage,
  passingScore: attempt.passingScore,
  passed: attempt.passed,
  durationSeconds: attempt.durationSeconds,
  progressCurrentQuestionIndex: attempt.progressCurrentQuestionIndex,
  progressAnsweredQuestionIndexes: attempt.progressAnsweredQuestionIndexes,
  progressAnswers: attempt.progressAnswers,
  progressCheckedAnswers: attempt.progressCheckedAnswers,
  progressBookmarkedIndexes: attempt.progressBookmarkedIndexes,
  progressDurationSeconds: attempt.progressDurationSeconds,
  progressSavedAt: attempt.progressSavedAt
});

export const orderAttemptsByRecent = <T extends { startedAt: string }>(attempts: T[]): T[] => {
  return [...attempts].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
};
