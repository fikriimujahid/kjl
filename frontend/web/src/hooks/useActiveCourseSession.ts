'use client';

import { useState } from 'react';
import { fetchLearningSessionImages } from '@/services/learning/learningApi';
import type { ProductDetail, Session } from '@/types/product';

interface UseActiveCourseSessionOptions {
  selectedProduct: ProductDetail | null;
  accessToken?: string;
}

interface UseActiveCourseSessionResult {
  loadingSessionId: string | null;
  activeSession: Session | null;
  activeImagePages: string[];
  openSession: (topicId: string, session: Session) => Promise<void>;
  closeSession: () => void;
}

export function useActiveCourseSession({
  selectedProduct,
  accessToken,
}: UseActiveCourseSessionOptions): UseActiveCourseSessionResult {
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeImagePages, setActiveImagePages] = useState<string[]>([]);

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
        setActiveSession({
          ...session,
          topicId,
          contentUrl: imagePages[0] ?? '',
        });
      } else {
        setActiveImagePages([]);
        setActiveSession({ ...session, topicId });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoadingSessionId(null);
    }
  };

  const closeSession = () => {
    setActiveSession(null);
    setActiveImagePages([]);
  };

  return {
    loadingSessionId,
    activeSession,
    activeImagePages,
    openSession,
    closeSession,
  };
}
