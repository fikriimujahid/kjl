'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/classnames';

interface QuizViewerBottomBarProps {
  currentIndex: number;
  totalQuestions: number;
  isSubmitting: boolean;
  submitError: string | null;
  isPracticeMode: boolean;
  actionLabel: string;
  canRunPrimaryAction: boolean;
  onPrevious: () => void;
  onPrimaryAction: () => void;
}

export function QuizViewerBottomBar({
  currentIndex,
  totalQuestions,
  isSubmitting,
  submitError,
  isPracticeMode,
  actionLabel,
  canRunPrimaryAction,
  onPrevious,
  onPrimaryAction,
}: QuizViewerBottomBarProps) {
  return (
    <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-white flex items-center justify-between gap-4">
      <button
        disabled={currentIndex === 0 || isSubmitting}
        onClick={onPrevious}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <ArrowLeft size={16} />
        Sebelumnya
      </button>

      <div className="flex flex-col items-center gap-0.5">
        {submitError && (
          <p className="text-xs text-red-500 font-semibold">{submitError}</p>
        )}
        <span className="text-xs text-slate-400 font-medium hidden sm:block">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      <button
        disabled={!canRunPrimaryAction || isSubmitting}
        onClick={onPrimaryAction}
        className={cn(
          'flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed',
          isPracticeMode
            ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-100 hover:shadow-violet-200'
            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100 hover:shadow-rose-200',
        )}
      >
        {isSubmitting ? 'Memproses...' : actionLabel}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
