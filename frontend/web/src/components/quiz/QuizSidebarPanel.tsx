'use client';

import { useState } from 'react';
import { Bookmark } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { LearningSessionAnswerCheckResult } from '@/services/learning/learningApi';
import type { SelectedAnswer } from '@/types/quiz';

type SidebarFilter = 'all' | 'answered' | 'unanswered' | 'bookmarked';

interface QuizSidebarPanelProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<number, SelectedAnswer>;
  bookmarkedIndexes: Set<number>;
  checkedAnswers: Record<number, LearningSessionAnswerCheckResult>;
  isPracticeMode: boolean;
  onJump: (index: number) => void;
}

const FILTER_LABELS: Record<SidebarFilter, string> = {
  all: 'Semua',
  answered: 'Dijawab',
  unanswered: 'Belum',
  bookmarked: 'Ditandai',
};

type TileState = 'correct' | 'wrong' | 'answered' | 'unanswered';

export function QuizSidebarPanel({
  totalQuestions,
  currentIndex,
  answers,
  bookmarkedIndexes,
  checkedAnswers,
  isPracticeMode,
  onJump,
}: QuizSidebarPanelProps) {
  const [filter, setFilter] = useState<SidebarFilter>('all');

  const allIndexes = Array.from({ length: totalQuestions }, (_, i) => i);

  const filteredIndexes = allIndexes.filter((i) => {
    if (filter === 'answered') return Boolean(answers[i]);
    if (filter === 'unanswered') return !answers[i];
    if (filter === 'bookmarked') return bookmarkedIndexes.has(i);
    return true;
  });

  const answeredCount = allIndexes.filter((i) => Boolean(answers[i])).length;
  const bookmarkedCount = bookmarkedIndexes.size;

  const getTileState = (index: number): TileState => {
    const checked = checkedAnswers[index];

    if (isPracticeMode && checked) {
      return checked.isCorrect ? 'correct' : 'wrong';
    }

    return Boolean(answers[index]) ? 'answered' : 'unanswered';
  };

  return (
    <div className="flex flex-col border-r border-slate-200 bg-slate-50 overflow-hidden w-full h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white shrink-0">
        <h2 className="font-bold text-slate-800 text-sm">Daftar Soal</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          {answeredCount} / {totalQuestions} terjawab
          {bookmarkedCount > 0 && (
            <span className="ml-2 text-amber-600">· {bookmarkedCount} ditandai</span>
          )}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="px-3 py-2.5 border-b border-slate-200 bg-white flex gap-1.5 flex-wrap shrink-0">
        {(Object.keys(FILTER_LABELS) as SidebarFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all',
              filter === f
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
            )}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {/* Question tiles */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredIndexes.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Tidak ada soal</p>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {filteredIndexes.map((i) => {
              const state = getTileState(i);
              const isCurrent = currentIndex === i;
              const isBookmarked = bookmarkedIndexes.has(i);

              return (
                <button
                  key={i}
                  onClick={() => onJump(i)}
                  title={`Soal ${i + 1}${answers[i] ? ' · terjawab' : ''}${isBookmarked ? ' · ditandai' : ''}`}
                  className={cn(
                    'relative aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all focus:outline-none',
                    isCurrent && 'ring-2 ring-offset-1 ring-indigo-500',
                    state === 'correct' && 'bg-emerald-500 text-white hover:bg-emerald-600',
                    state === 'wrong' && 'bg-rose-500 text-white hover:bg-rose-600',
                    state === 'answered' && 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
                    state === 'unanswered' && 'bg-white text-slate-500 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600',
                    isCurrent && state === 'unanswered' && 'bg-indigo-50 border-indigo-300 text-indigo-600',
                    isCurrent && state === 'answered' && 'bg-indigo-200',
                  )}
                >
                  {i + 1}
                  {isBookmarked && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center shadow-sm">
                      <Bookmark size={7} className="text-white fill-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white shrink-0 flex flex-wrap gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-indigo-100 inline-block shrink-0" />
          Dijawab
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="w-3 h-3 rounded-sm bg-white border border-slate-200 inline-block shrink-0" />
          Belum
        </span>
        {isPracticeMode && (
          <>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block shrink-0" />
              Benar
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block shrink-0" />
              Salah
            </span>
          </>
        )}
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-400 inline-block shrink-0" />
          Ditandai
        </span>
      </div>
    </div>
  );
}
