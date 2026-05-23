'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useQuizPageData } from '@/hooks/useQuizPageData';
import QuizViewer from '@/components/quiz/QuizViewer';

export default function QuizPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const {
    backHref,
    mode,
    questions,
    productId,
    topicId,
    sessionId,
    attemptId,
    isLoading,
    error,
    durationMinutes,
  } = useQuizPageData(accessToken ?? undefined);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3 sticky top-0 z-10">
        <button
          onClick={() => router.push(backHref)}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Kembali ke Materi
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-8 py-6 max-w-[1400px] mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium">Memuat soal...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center min-h-[500px]">
            <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-8 text-center max-w-md">
              <p className="text-rose-600 font-semibold mb-4">{error}</p>
              <button
                onClick={() => router.push(backHref)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-all"
              >
                Kembali
              </button>
            </div>
          </div>
        ) : (
          <QuizViewer
            mode={mode}
            questions={questions}
            productId={productId}
            topicId={topicId}
            sessionId={sessionId}
            attemptId={attemptId}
            accessToken={accessToken ?? undefined}
            durationMinutes={durationMinutes}
          />
        )}
      </div>
    </div>
  );
}
