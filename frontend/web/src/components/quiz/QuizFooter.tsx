'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { SelectedAnswer } from '@/types/quiz';

function getPaginationItems(current: number, total: number): (number | '...')[] {
  if (total <= 9) return Array.from({ length: total }, (_, i) => i);
  const items: (number | '...')[] = [0];
  if (current > 3) items.push('...');
  const start = Math.max(1, current - 2);
  const end = Math.min(total - 2, current + 2);
  for (let i = start; i <= end; i++) items.push(i);
  if (current < total - 4) items.push('...');
  items.push(total - 1);
  return items;
}

interface QuizFooterProps {
  currentIndex: number;
  totalQuestions: number;
  answers: Record<number, SelectedAnswer>;
  isSubmitting: boolean;
  submitError: string | null;
  actionLabel: string;
  onPrev: () => void;
  onJump: (index: number) => void;
  onPrimaryAction: () => void;
}

export function QuizFooter({
  currentIndex,
  totalQuestions,
  answers,
  isSubmitting,
  submitError,
  actionLabel,
  onPrev,
  onJump,
  onPrimaryAction,
}: QuizFooterProps) {
  return (
    <div className="p-6 border-t border-slate-100 flex items-center justify-between">
      <button
        disabled={currentIndex === 0 || isSubmitting}
        onClick={onPrev}
        className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
      >
        <ArrowLeft size={16} />
        Sebelumnya
      </button>

      <div className="hidden sm:flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          {getPaginationItems(currentIndex, totalQuestions).map((item, i) =>
            item === '...' ? (
              <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs select-none">...</span>
            ) : (
              <button
                key={item}
                onClick={() => onJump(item as number)}
                title={`Soal ${(item as number) + 1}${answers[item as number] ? ' (terjawab)' : ''}`}
                className={cn(
                  'w-7 h-7 rounded-lg text-[10px] font-bold transition-all',
                  currentIndex === item
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-110 ring-2 ring-indigo-300'
                    : answers[item as number]
                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200',
                )}
              >
                {(item as number) + 1}
              </button>
            )
          )}
        </div>

        <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-teal-300 inline-block" />Terjawab</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-slate-200 inline-block" />Belum</span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-2">
        <button
          disabled={!answers[currentIndex] || isSubmitting}
          onClick={onPrimaryAction}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-100 transition-all disabled:opacity-50"
        >
          {isSubmitting ? 'Memproses...' : actionLabel}
          <ArrowRight size={16} />
        </button>

        {submitError && <p className="text-xs text-red-500 font-semibold">{submitError}</p>}
      </div>
    </div>
  );
}
