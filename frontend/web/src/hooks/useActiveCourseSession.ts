'use client';

import { useState } from 'react';
import { fetchLearningSessionImages, fetchLearningSessionQuestions } from '@/services/learning/learningApi';
import type { ActiveCourseSession } from '@/types/course-session';
import type { ProductDetail, Session } from '@/types/product';

interface UseActiveCourseSessionOptions {
  selectedProduct: ProductDetail | null;
  accessToken?: string;
}

interface UseActiveCourseSessionResult {
  loadingSessionId: string | null;
  activeSession: ActiveCourseSession | null;
  openSession: (topicId: string, session: Session) => Promise<void>;
}

export function useActiveCourseSession({ 
  selectedProduct,
  accessToken,
}: UseActiveCourseSessionOptions): UseActiveCourseSessionResult {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveCourseSession | null>(null);

  const openSession = async (topicId: string, session: Session) => {
    if (loadingSessionId === session.id || !selectedProduct) {
      return;
    }

    setLoadingSessionId(session.id);

    try {
      if (session.type === 'images') {
        const imagePages = await fetchLearningSessionImages({
          productId: selectedProduct.id,
          topicId,
          sessionId: session.id,
          accessToken,
        });

        setActiveSession({
          ...session,
          topicId,
          contentUrl: imagePages[0] ?? '',
          content: {
            kind: 'images',
            imagePages,
            questions: [],
          },
        });
      } else if (session.type === 'exam' || session.type === 'practice') {
        const questions = await fetchLearningSessionQuestions({
          productId: selectedProduct.id,
          topicId,
          sessionId: session.id,
          accessToken,
        });

        setActiveSession({
          ...session,
          topicId,
          content: {
            kind: 'questions',
            imagePages: [],
            questions,
          },
        });
      } else {
        setActiveSession({
          ...session,
          topicId,
          content: {
            kind: 'none',
            imagePages: [],
            questions: [],
          },
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoadingSessionId(null);
    }
  };

  return {
    loadingSessionId,
    activeSession,
    openSession,
  };
}
