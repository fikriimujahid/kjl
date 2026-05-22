'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, BookmarkCheck, LayoutList, X } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { Question } from '@/types/product';
import type { QuizMode } from '@/types/quiz';
import { useQuizSession } from '@/hooks/useQuizSession';
import { QuizCompletionView } from '@/components/quiz/QuizCompletionView';
import { QuizQuestionPanel } from '@/components/quiz/QuizQuestionPanel';
import { QuizSidebarPanel } from '@/components/quiz/QuizSidebarPanel';

interface QuizViewerProps {
  mode: QuizMode;
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId?: string;
  accessToken?: string;
}

export default function QuizViewer({
  mode,
  questions,
  productId,
  topicId,
  sessionId,
  attemptId,
  accessToken,
}: QuizViewerProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const quiz = useQuizSession({
    mode,
    questions,
    productId,
    topicId,
    sessionId,
    attemptId,
    accessToken,
  });

  if (questions.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Kuis Belum Tersedia</h2>
        <p className="text-slate-500 font-medium">Data pertanyaan untuk sesi ini belum bisa dimuat.</p>
      </div>
    );
  }

  if (quiz.isComplete && quiz.result) {
    return <QuizCompletionView mode={mode} result={quiz.result} onReset={quiz.reset} />;
  }

  const isBookmarked = quiz.bookmarkedIndexes.has(quiz.currentIndex);
  const answeredCount = questions.filter((_, i) => quiz.answers[i]).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);

  const sidebarProps = {
    totalQuestions: questions.length,
    currentIndex: quiz.currentIndex,
    answers: quiz.answers,
    bookmarkedIndexes: quiz.bookmarkedIndexes,
    checkedAnswers: quiz.checkedAnswers,
    isPracticeMode: quiz.isPracticeMode,
    onJump: (index: number) => {
      quiz.goToQuestion(index);
      setMobileSidebarOpen(false);
    },
  };

  return (
    <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[680px]">
      {/* ── Desktop sidebar (always visible on lg+) ─────────────────── */}
      <div className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col">
        <QuizSidebarPanel {...sidebarProps} />
      </div>

      {/* ── Mobile sidebar overlay ───────────────────────────────────── */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 h-full bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-bold text-slate-700">Navigasi Soal</span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-all"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <QuizSidebarPanel {...sidebarProps} />
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 border-l border-slate-100">

        {/* Top bar */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Mobile sidebar toggle */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
            >
              <LayoutList size={14} />
              Soal
            </button>

            <span
              className={cn(
                'px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider',
                quiz.isPracticeMode
                  ? 'bg-violet-100 text-violet-700'
                  : 'bg-rose-100 text-rose-700',
              )}
            >
              {quiz.isPracticeMode ? 'Latihan' : 'Ujian'}
            </span>

            <span className="text-sm font-semibold text-slate-700">
              Soal{' '}
              <span className={cn(quiz.isPracticeMode ? 'text-violet-600' : 'text-rose-600')}>
                {quiz.currentIndex + 1}
              </span>{' '}
              dari {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
              <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    quiz.isPracticeMode ? 'bg-violet-500' : 'bg-rose-500',
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{answeredCount}/{questions.length} terjawab</span>
            </div>

            <button
              onClick={() => quiz.toggleBookmark(quiz.currentIndex)}
              title={isBookmarked ? 'Hapus tanda' : 'Tandai soal ini'}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                isBookmarked
                  ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-600',
              )}
            >
              {isBookmarked
                ? <BookmarkCheck size={14} className="fill-amber-500 text-amber-600" />
                : <Bookmark size={14} />}
              <span className="hidden sm:inline">{isBookmarked ? 'Ditandai' : 'Tandai'}</span>
            </button>
          </div>
        </div>

        {/* Scrollable question area */}
        <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
          <QuizQuestionPanel
            question={quiz.currentQuestion}
            currentIndex={quiz.currentIndex}
            answer={quiz.answers[quiz.currentIndex]}
            isPracticeMode={quiz.isPracticeMode}
            isCurrentAnswerChecked={quiz.isCurrentAnswerChecked}
            checkedAnswer={quiz.currentCheckedAnswer}
            onSelectAnswer={quiz.selectAnswer}
          />
        </div>

        {/* Bottom action bar */}
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
          <button
            disabled={quiz.currentIndex === 0 || quiz.isSubmitting}
            onClick={quiz.goPrevious}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ArrowLeft size={16} />
            Sebelumnya
          </button>

          <div className="flex flex-col items-center gap-0.5">
            {quiz.submitError && (
              <p className="text-xs text-red-500 font-semibold">{quiz.submitError}</p>
            )}
            <span className="text-xs text-slate-400 font-medium hidden sm:block">
              {quiz.currentIndex + 1} / {questions.length}
            </span>
          </div>

          <button
            disabled={!quiz.answers[quiz.currentIndex] && !quiz.isCurrentAnswerChecked || quiz.isSubmitting}
            onClick={() => { void quiz.handlePrimaryAction(); }}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed',
              quiz.isPracticeMode
                ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-100 hover:shadow-violet-200'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 hover:shadow-rose-200',
            )}
          >
            {quiz.isSubmitting ? 'Memproses...' : quiz.actionLabel}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
