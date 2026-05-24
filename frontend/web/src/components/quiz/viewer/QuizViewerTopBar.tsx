'use client';

import { Bookmark, BookmarkCheck, Clock, LayoutList } from 'lucide-react';
import { cn } from '@/utils/classnames';

interface QuizViewerTopBarProps {
  isPracticeMode: boolean;
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  progressPercent: number;
  timerDisplay: string;
  timerIsLow: boolean;
  isBookmarked: boolean;
  onOpenSidebar: () => void;
  onToggleBookmark: () => void;
}

export function QuizViewerTopBar({
  isPracticeMode,
  currentIndex,
  totalQuestions,
  answeredCount,
  progressPercent,
  timerDisplay,
  timerIsLow,
  isBookmarked,
  onOpenSidebar,
  onToggleBookmark,
}: QuizViewerTopBarProps) {
  return (
    <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
        >
          <LayoutList size={14} />
          Soal
        </button>

        <span
          className={cn(
            'px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider',
            isPracticeMode
              ? 'bg-violet-100 text-violet-700'
              : 'bg-rose-100 text-rose-700',
          )}
        >
          {isPracticeMode ? 'Latihan' : 'Ujian'}
        </span>

        <span className="text-sm font-semibold text-slate-700">
          Soal{' '}
          <span className={cn(isPracticeMode ? 'text-violet-600' : 'text-rose-600')}>
            {currentIndex + 1}
          </span>{' '}
          dari {totalQuestions}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end gap-1 min-w-[120px]">
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isPracticeMode ? 'bg-violet-500' : 'bg-rose-500',
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">{answeredCount}/{totalQuestions} terjawab</span>
        </div>

        {timerDisplay !== '--:--' && (
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold tabular-nums',
              timerIsLow
                ? 'bg-red-50 border-red-300 text-red-600 animate-pulse'
                : isPracticeMode
                  ? 'bg-slate-50 border-slate-200 text-slate-500'
                  : 'bg-rose-50 border-rose-200 text-rose-500',
            )}
          >
            <Clock size={12} />
            {timerDisplay}
          </div>
        )}

        <button
          onClick={onToggleBookmark}
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
  );
}
