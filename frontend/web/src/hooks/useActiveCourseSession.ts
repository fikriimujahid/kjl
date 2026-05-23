'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchLearningSessionImages, fetchLearningSessionQuestions } from '@/services/learning/learningApi';
import { saveSessionCheckin } from '@/services/auth/checkinApi';
import type { ActiveCourseSession } from '@/types/course-session';
import type { ProductDetail, Session } from '@/types/product';

interface UseActiveCourseSessionOptions {
  selectedProduct: ProductDetail | null;
  accessToken?: string;
  lastCheckinDate?: string;
}

interface UseActiveCourseSessionResult {
  loadingSessionId: string | null;
  activeSession: ActiveCourseSession | null;
  openSession: (topicId: string, session: Session) => Promise<void>;
}

export function useActiveCourseSession({ 
  selectedProduct,
  accessToken,
  lastCheckinDate,
}: UseActiveCourseSessionOptions): UseActiveCourseSessionResult {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<ActiveCourseSession | null>(null);
  const lastCheckinDateRef = useRef<string | undefined>(lastCheckinDate);

  useEffect(() => {
    lastCheckinDateRef.current = lastCheckinDate;
  }, [lastCheckinDate]);

  const toJakartaDateKey = (): string => {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  };

  const openSession = async (topicId: string, session: Session) => {
    if (loadingSessionId === session.id || !selectedProduct) {
      return;
    }

    const today = toJakartaDateKey();

    if (accessToken && lastCheckinDateRef.current !== today) {
      void saveSessionCheckin({
        productId: selectedProduct.id,
        topicId,
        sessionId: session.id,
        accessToken,
      }).then((checkinResult) => {
        if (checkinResult?.activityDate) {
          lastCheckinDateRef.current = checkinResult.activityDate;
        }
      });
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
