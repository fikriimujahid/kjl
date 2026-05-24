'use client';

import { BarChart2, BookOpen, CheckSquare, Coffee, Loader2, PlayCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { PracticeInstructionsScreenProps } from '../../../types/assessment';

const INSTRUCTIONS = [
  {
    icon: CheckSquare,
    text: 'Kamu dapat mengklik "Periksa Jawaban" untuk mendapatkan umpan balik langsung beserta penjelasan jawabannya.',
  },
  {
    icon: Coffee,
    text: 'Kamu dapat beristirahat kapan saja dan melanjutkan latihan nanti.',
  },
  {
    icon: RefreshCcw,
    text: 'Kamu dapat mengulang latihan sebanyak yang kamu inginkan.',
  },
  {
    icon: BarChart2,
    text: 'Progress bar di bagian atas layar akan menampilkan progresmu. Jika ingin menyelesaikan latihan dan melihat hasil segera, klik tombol "Selesaikan Latihan".',
  },
] as const;

export function PracticeInstructionsScreen({
  sessionTitle,
  totalQuestions,
  onBegin,
  onBack,
  isLoading = false,
}: PracticeInstructionsScreenProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-7 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-full mb-4">
              <BookOpen size={28} className="text-white" />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight leading-snug">
              Latihan Soal
            </h1>
            <p className="text-violet-200 text-sm font-medium mt-1 line-clamp-2">{sessionTitle}</p>
          </div>

          <div className="px-8 pt-5 pb-2">
            <p className="text-slate-700 font-semibold text-sm">{totalQuestions} soal</p>
          </div>

          <div className="px-8 py-4">
            <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest mb-4">Petunjuk:</h2>
            <ul className="space-y-3">
              {INSTRUCTIONS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                    <Icon size={16} className={cn('shrink-0 mt-0.5', 'text-violet-500')} />
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              ← Kembali ke Hasil
            </button>
            <button
              onClick={onBegin}
              disabled={isLoading}
              className="flex items-center gap-2 px-8 py-3 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.97] bg-violet-600 hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <PlayCircle size={18} />
              )}
              {isLoading ? 'Memuat...' : 'Mulai Latihan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
