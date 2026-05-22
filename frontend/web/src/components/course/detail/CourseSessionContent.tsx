'use client';

import ImageViewer from '@/components/course/ImageViewer';
import QuizViewer from '@/components/course/QuizViewer';
import type { Question, Session } from '@/types/product';
import { SessionTypeIcon } from './SessionTypeIcon';

interface CourseSessionContentProps {
  productId: string;
  activeSession: Session | null;
  activeImagePages: string[];
  activeQuestions: Question[];
  accessToken?: string;
}

export function CourseSessionContent({
  productId,
  activeSession,
  activeImagePages,
  activeQuestions,
  accessToken,
}: CourseSessionContentProps) {
  if (activeSession) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="min-h-[400px]">
          {activeSession.type === 'images' ? (
            <ImageViewer title={activeSession.title} images={activeImagePages} />
          ) : activeSession.type === 'exam' || activeSession.type === 'practice' ? (
            <QuizViewer
              mode={activeSession.type}
              questions={activeQuestions}
              productId={productId}
              topicId={activeSession.topicId}
              sessionId={activeSession.id}
              accessToken={accessToken}
            />
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
