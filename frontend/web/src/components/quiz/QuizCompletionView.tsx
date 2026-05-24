'use client';

import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { QuizMode, QuizResult } from '@/types/quiz';

interface QuizCompletionViewProps {
  mode: QuizMode;
  result: QuizResult;
  onBackToMaterial: () => void;
}

export function QuizCompletionView({ mode, result, onBackToMaterial }: QuizCompletionViewProps) {
  const correctCount = result.correctAnswers ?? result.details.filter((detail) => detail.isCorrect).length;
  const failed = !result.passed;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 text-center">
      <div
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner',
          failed ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600',
        )}
      >
        <CheckCircle2 size={48} />
      </div>

      <h2 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">
        {failed ? 'Belum Lulus Kuis' : 'Kuis Selesai!'}
      </h2>

      <p className="text-xl text-slate-500 font-medium mb-10">
        Kamu menjawab{' '}
        <span className="text-indigo-600 font-bold">
          {correctCount} dari {result.totalQuestions}
        </span>{' '}
        pertanyaan dengan benar.
      </p>

      <p className="text-lg text-slate-600 font-medium mb-8">
        Skor: <span className="font-bold text-slate-800">{result.obtainedScore}</span> / {result.maxScore}
        {' '}({result.percentage}%)
        {' '}• Passing score: {result.passingScore}%
      </p>

      <div className="flex gap-4 justify-center">
        <button
            onClick={onBackToMaterial}
          className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
        >
            <ArrowLeft size={18} /> Kembali ke Materi
        </button>
      </div>
    </motion.div>
  );
}
