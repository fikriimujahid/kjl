'use client';

import { useState } from 'react';
import { fetchLearningSessionImages, fetchLearningSessionQuestions } from '@/services/learning/learningApi';
import type { ProductDetail, Question, Session } from '@/types/product';

interface UseActiveCourseSessionOptions {
  selectedProduct: ProductDetail | null;
  accessToken?: string;
}

interface UseActiveCourseSessionResult {
  loadingSessionId: string | null;
  activeSession: Session | null;
  activeImagePages: string[];
  activeQuestions: Question[];
  openSession: (topicId: string, session: Session) => Promise<void>;
}

export function useActiveCourseSession({ 
  selectedProduct,
  accessToken,
}: UseActiveCourseSessionOptions): UseActiveCourseSessionResult {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeImagePages, setActiveImagePages] = useState<string[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

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

        setActiveImagePages(imagePages);
        setActiveQuestions([]);
        setActiveSession({
          ...session,
          topicId,
          contentUrl: imagePages[0] ?? '',
        });
      } else if (session.type === 'exam' || session.type === 'practice') {
        const questions = await fetchLearningSessionQuestions({
          productId: selectedProduct.id,
          topicId,
          sessionId: session.id,
          accessToken,
        });

        setActiveImagePages([]);
        setActiveQuestions(questions);
        setActiveSession({ ...session, topicId });
      } else {
        setActiveImagePages([]);
        setActiveQuestions([]);
        setActiveSession({ ...session, topicId });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoadingSessionId(null);
    }
  };

  return {
    loadingSessionId,
    activeSession,
    activeImagePages,
    activeQuestions,
    openSession,
  };
}
