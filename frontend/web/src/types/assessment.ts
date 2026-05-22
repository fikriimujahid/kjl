import type { LearningAttemptSessionType } from '@/services/learning/learningApi';

export type AssessmentMode = LearningAttemptSessionType;

export interface AssessmentHistoryViewProps {
  mode: AssessmentMode;
  sessionTitle: string;
  passingScore?: number;
  productId: string;
  topicId: string;
  sessionId: string;
  accessToken?: string;
  onStartOrResume: () => void;
}

interface BaseInstructionsScreenProps {
  sessionTitle: string;
  totalQuestions: number;
  onBegin: () => void;
  onBack: () => void;
}

export interface PracticeInstructionsScreenProps extends BaseInstructionsScreenProps {}

export interface ExamInstructionsScreenProps extends BaseInstructionsScreenProps {
  durationMinutes?: number;
  passingScorePercent?: number;
  passingScorePoints?: number;
}
