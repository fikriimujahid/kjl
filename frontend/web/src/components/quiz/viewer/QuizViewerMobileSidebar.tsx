'use client';

import { X } from 'lucide-react';
import { QuizSidebarPanel } from '@/components/quiz/QuizSidebarPanel';
import type { LearningSessionAnswerCheckResult } from '@/services/learning/learningApi';
import type { SelectedAnswer } from '@/types/quiz';

interface QuizViewerMobileSidebarProps {
  isOpen: boolean;
  totalQuestions: number;
  currentIndex: number;
  answers: Record<number, SelectedAnswer>;
  bookmarkedIndexes: Set<number>;
  checkedAnswers: Record<number, LearningSessionAnswerCheckResult>;
  isPracticeMode: boolean;
  onClose: () => void;
  onJump: (index: number) => void;
}

export function QuizViewerMobileSidebar({
  isOpen,
  totalQuestions,
  currentIndex,
  answers,
  bookmarkedIndexes,
  checkedAnswers,
  isPracticeMode,
  onClose,
  onJump,
}: QuizViewerMobileSidebarProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative z-10 w-72 h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-sm font-bold text-slate-700">Navigasi Soal</span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 transition-all"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          <QuizSidebarPanel
            totalQuestions={totalQuestions}
            currentIndex={currentIndex}
            answers={answers}
            bookmarkedIndexes={bookmarkedIndexes}
            checkedAnswers={checkedAnswers}
            isPracticeMode={isPracticeMode}
            onJump={onJump}
          />
        </div>
      </div>
    </div>
  );
}
