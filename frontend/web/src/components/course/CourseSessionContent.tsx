'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageViewer from '@/components/course/ImageViewer';
import { useCourseSessionAttempts, type SessionView } from '@/hooks/useCourseSessionAttempts';
import type { ActiveCourseSession } from '@/types/course-session';
import type { Session } from '@/types/product';
import { SessionTypeIcon } from './SessionTypeIcon';
import { AssessmentHistoryView } from './assessment/AssessmentHistoryView';
import { PracticeInstructionsScreen } from './assessment/PracticeInstructionsScreen';
import { ExamInstructionsScreen } from './assessment/ExamInstructionsScreen';

type AssessmentMode = 'practice' | 'exam';

const INITIAL_SESSION_VIEWS: Record<AssessmentMode, SessionView> = {
  practice: 'history',
  exam: 'history',
};

const isAssessmentMode = (sessionType: Session['type']): sessionType is AssessmentMode => {
  return sessionType === 'practice' || sessionType === 'exam';
};

interface CourseSessionContentProps {
  productId: string;
  activeSession: ActiveCourseSession | null;
  accessToken?: string;
}

export function CourseSessionContent({
  productId,
  activeSession,
  accessToken,
}: CourseSessionContentProps) {
  const router = useRouter();
  const [sessionViews, setSessionViews] = useState<Record<AssessmentMode, SessionView>>(INITIAL_SESSION_VIEWS);
  const [isStarting, setIsStarting] = useState(false);

  const { startAttempt } = useCourseSessionAttempts({
    productId,
    activeSession,
    accessToken,
  });

  const setSessionView = (mode: AssessmentMode, view: SessionView) => {
    setSessionViews((currentSessionViews) => ({
      ...currentSessionViews,
      [mode]: view,
    }));
  };

  // Reset all assessment views whenever the active session changes.
  useEffect(() => {
    setSessionViews(INITIAL_SESSION_VIEWS);
  }, [activeSession?.id]);

  const goToTesting = async (mode: AssessmentMode) => {
    if (!activeSession) return;
    setIsStarting(true);
    try {
      const attemptId = await startAttempt(mode);
      const params = new URLSearchParams({
        productId,
        topicId: activeSession.topicId,
        sessionId: activeSession.id,
        mode,
        ...(attemptId ? { attemptId } : {}),
        ...(activeSession.duration != null ? { duration: String(activeSession.duration) } : {}),
      });
      router.push(`/quiz?${params.toString()}`);
    } finally {
      setIsStarting(false);
    }
  };

  if (activeSession) {
    if (isAssessmentMode(activeSession.type)) {
      const mode = activeSession.type;
      const currentView = sessionViews[mode];

      if (currentView === 'history') {
        return (
          <AssessmentHistoryView
            mode={mode}
            sessionTitle={activeSession.title}
            passingScore={activeSession.passingScore}
            duration={activeSession.duration}
            productId={productId}
            topicId={activeSession.topicId}
            sessionId={activeSession.id}
            accessToken={accessToken}
            onStartOrResume={() => setSessionView(mode, 'instructions')}
          />
        );
      }

      if (currentView === 'instructions') {
        if (mode === 'practice') {
          return (
            <PracticeInstructionsScreen
              sessionTitle={activeSession.title}
              totalQuestions={activeSession.content.questions.length}
              isLoading={isStarting}
              onBegin={() => {
                void goToTesting(mode);
              }}
              onBack={() => setSessionView(mode, 'history')}
            />
          );
        }

        return (
          <ExamInstructionsScreen
            sessionTitle={activeSession.title}
            totalQuestions={activeSession.content.questions.length}
            durationMinutes={activeSession.duration}
            passingScorePercent={activeSession.passingScore}
            isLoading={isStarting}
            onBegin={() => {
              void goToTesting(mode);
            }}
            onBack={() => setSessionView(mode, 'history')}
          />
        );
      }

    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="min-h-[400px]">
          {activeSession.type === 'images' ? (
            <ImageViewer title={activeSession.title} images={activeSession.content.imagePages} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex items-center justify-center text-slate-500 font-medium">
              Konten untuk tipe sesi ini akan segera tersedia.
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-300">
        <SessionTypeIcon type="exam" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Siap Mulai Belajar?</h2>
      <p className="text-slate-400 max-w-sm font-medium text-sm leading-relaxed">Pilih sebuah sesi dari kurikulum di sebelah kiri untuk menampilkan materi, kuis, atau audio pembelajaran.</p>
    </div>
  );
}
