'use client';

import { useCourseDetail } from '@/hooks/useCourseDetail';
import { useAuth } from '@/hooks/useAuth';
import { useActiveCourseSession } from '@/hooks/useActiveCourseSession';
import { CourseCurriculumSidebar } from '@/components/course/CourseCurriculumSidebar';
import { CourseSessionContent } from '@/components/course/CourseSessionContent';

interface CourseDetailPageProps {
  productId: string;
}

export default function CourseDetailPage({ productId }: CourseDetailPageProps) {
  const { accessToken } = useAuth();
  const { selectedProduct, isLoadingProduct, productError } = useCourseDetail({ productId });
  const {
    loadingSessionId,
    activeSession,
    openSession,
  } = useActiveCourseSession({
    selectedProduct,
    accessToken: accessToken ?? undefined,
  });

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
