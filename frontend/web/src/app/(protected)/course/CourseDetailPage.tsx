'use client';

import { useCourseDetail } from '@/hooks/useCourseDetail';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useActiveCourseSession } from '@/hooks/useActiveCourseSession';
import { CourseCurriculumSidebar } from '@/components/course/detail/CourseCurriculumSidebar';
import { CourseSessionContent } from '@/components/course/detail/CourseSessionContent';

interface CourseDetailPageProps {
  productId: string;
}

export default function CourseDetailPage({ productId }: CourseDetailPageProps) {
  const { accessToken } = useAuth();
  const { selectedProduct, isLoadingProduct, productError } = useCourseDetail({ productId });
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const {
    loadingSessionId,
    activeSession,
    activeImagePages,
    openSession,
    closeSession,
  } = useActiveCourseSession({
    selectedProduct,
    accessToken: accessToken ?? undefined,
  });

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopic((currentTopicId) => (currentTopicId === topicId ? null : topicId));
  };

  return (
    <div className="mx-auto px-3 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 overflow-visible">
          <CourseCurriculumSidebar
            selectedProduct={selectedProduct}
            isLoadingProduct={isLoadingProduct}
            productError={productError}
            expandedTopic={expandedTopic}
            loadingSessionId={loadingSessionId}
            activeSessionId={activeSession?.id ?? null}
            onToggleTopic={handleToggleTopic}
            onSessionClick={openSession}
          />
        </div>

        <div className="lg:col-span-9 order-1 lg:order-2">
          <CourseSessionContent
            activeSession={activeSession}
            activeImagePages={activeImagePages}
            isLoadingProduct={isLoadingProduct}
            onCloseSession={closeSession}
          />
        </div>
      </div>
    </div>
  );
}
