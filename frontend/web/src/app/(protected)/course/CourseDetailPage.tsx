'use client';

import { useEffect, useRef } from 'react';
import { useCourseDetail } from '@/hooks/useCourseDetail';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCourseSession } from '@/hooks/useActiveCourseSession';
import { CourseCurriculumSidebar } from '@/components/course/CourseCurriculumSidebar';
import { CourseSessionContent } from '@/components/course/CourseSessionContent';

interface CourseDetailPageProps {
  productId: string;
  topicId?: string;
  sessionId?: string;
}

export default function CourseDetailPage({ productId, topicId, sessionId }: CourseDetailPageProps) {
  const { accessToken, user } = useAuth();
  const { selectedProduct, isLoadingProduct, productError } = useCourseDetail({ productId });
  const {
    loadingSessionId,
    activeSession,
    openSession,
  } = useActiveCourseSession({
    selectedProduct,
    accessToken: accessToken ?? undefined,
    lastCheckinDate: user?.lastCheckinDate,
  });
  const autoOpenedSessionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedProduct || !topicId || !sessionId) {
      return;
    }

    if (activeSession?.id === sessionId) {
      return;
    }

    const targetKey = `${selectedProduct.id}:${topicId}:${sessionId}`;
    if (autoOpenedSessionKeyRef.current === targetKey) {
      return;
    }

    const topic = selectedProduct.topics.find((item) => item.id === topicId);
    const session = topic?.sessions.find((item) => item.id === sessionId);
    if (!topic || !session) {
      return;
    }

    autoOpenedSessionKeyRef.current = targetKey;
    void openSession(topic.id, session);
  }, [activeSession?.id, openSession, selectedProduct, sessionId, topicId]);

  return (
    <div className="mx-auto px-3 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 overflow-visible">
          <CourseCurriculumSidebar
            selectedProduct={selectedProduct}
            isLoadingProduct={isLoadingProduct}
            productError={productError}
            loadingSessionId={loadingSessionId}
            activeSessionId={activeSession?.id ?? null}
            onSessionClick={openSession}
          />
        </div>

        <div className="lg:col-span-9 order-1 lg:order-2">
          <CourseSessionContent
            productId={productId}
            activeSession={activeSession}
            accessToken={accessToken ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
