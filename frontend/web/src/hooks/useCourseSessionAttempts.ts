'use client';

import { useCallback } from 'react';
import {
  startLearningSessionAttempt,
  type LearningAttemptSessionType,
} from '@/services/learning/learningApi';
import type { Session } from '@/types/product';

export type SessionView = 'history' | 'instructions';

interface UseCourseSessionAttemptsOptions {
  productId: string;
  activeSession: Session | null;
  accessToken?: string;
}

interface UseCourseSessionAttemptsResult {
  startAttempt: (sessionType: LearningAttemptSessionType) => Promise<string | undefined>;
}

export function useCourseSessionAttempts({
  productId,
  activeSession,
  accessToken,
}: UseCourseSessionAttemptsOptions): UseCourseSessionAttemptsResult {
  const startAttempt = useCallback(async (sessionType: LearningAttemptSessionType): Promise<string | undefined> => {
    if (!activeSession || activeSession.type !== sessionType || !accessToken) {
      return;
    }

    const response = await startLearningSessionAttempt({
      productId,
      topicId: activeSession.topicId,
      sessionId: activeSession.id,
      accessToken,
    });

    return response?.attempt.attemptId;
  }, [accessToken, activeSession, productId]);

  return { startAttempt };
}
