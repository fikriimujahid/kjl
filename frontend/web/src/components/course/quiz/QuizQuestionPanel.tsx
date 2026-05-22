'use client';

import { motion } from 'motion/react';
import { CircleCheck, CircleX, Volume2 } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { Question } from '@/types/product';
import type { LearningSessionAnswerCheckResult } from '@/services/learning/learningApi';
import type { SelectedAnswer } from '@/types/quiz';

interface QuizQuestionPanelProps {
  question: Question;
  currentIndex: number;
  answer?: SelectedAnswer;
  isPracticeMode: boolean;
  isCurrentAnswerChecked: boolean;
  checkedAnswer?: LearningSessionAnswerCheckResult;
  onSelectAnswer: (option: string, optionId: string) => void;
}

function resolveCorrectAnswerLabel(question: Question, checkedAnswer: LearningSessionAnswerCheckResult): string {
  const optionIndex = question.optionIds?.findIndex((id) => id === checkedAnswer.correctAnswer) ?? -1;
  if (optionIndex >= 0 && question.options[optionIndex]) {
    return question.options[optionIndex];
  }

  return checkedAnswer.correctAnswer;
}

export function QuizQuestionPanel({
  question,
  currentIndex,
  answer,
  isPracticeMode,
  isCurrentAnswerChecked,
  checkedAnswer,
  onSelectAnswer,
}: QuizQuestionPanelProps) {
  return (
    <motion.div key={currentIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
      <div className="mb-8 p-8 bg-slate-50 rounded-xl border border-slate-100 w-full">
        <span className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">Pilih jawaban yang benar</span>

        {question.image && (
          <div className="mb-6">
            <img
              src={question.image}
              alt="Gambar soal"
              className="mx-auto max-h-56 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
          </div>
        )}

        {question.audio && (
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
              <Volume2 size={14} /> Dengarkan audio berikut
            </div>
            <audio controls className="w-full max-w-sm rounded-lg">
              <source src={question.audio} type="audio/mpeg" />
            </audio>
          </div>
        )}

        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{question.text}</h1>
        <p className="text-lg text-slate-600 font-medium">Klik pada salah satu opsi di bawah ini</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {question.options.map((option, idx) => {
          const optionId = question.optionIds?.[idx] ?? `opt${String.fromCharCode(65 + idx)}`;
          const isSelected = answer?.optionId === optionId;
          const isOptionDisabled = isPracticeMode && isCurrentAnswerChecked;

          return (
            <button
              key={idx}
              onClick={() => onSelectAnswer(option, optionId)}
              disabled={isOptionDisabled}
              className={cn(
                'p-6 rounded-xl border-2 transition-all text-left group flex items-center gap-4 disabled:cursor-not-allowed disabled:opacity-80',
                isSelected
                  ? 'border-indigo-600 bg-indigo-50'
                  : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50',
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
                isSelected
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-200 group-hover:text-indigo-600',
              )}>
                {String.fromCharCode(65 + idx)}
              </span>
              <span className="font-bold text-slate-800">{option}</span>
            </button>
          );
        })}
      </div>

      {isPracticeMode && checkedAnswer && (
        <div
          className={cn(
            'mt-6 rounded-xl border px-5 py-4 text-left',
            checkedAnswer.isCorrect
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800',
          )}
        >
          <div className="flex items-start gap-2 font-bold mb-2">
            {checkedAnswer.isCorrect ? <CircleCheck size={18} /> : <CircleX size={18} />}
            <span>
              {checkedAnswer.isCorrect ? 'Jawaban benar.' : 'Jawaban belum tepat.'}
            </span>
          </div>

          {!checkedAnswer.isCorrect && (
            <p className="text-sm font-medium mb-2">
              Jawaban benar: <span className="font-bold">{resolveCorrectAnswerLabel(question, checkedAnswer)}</span>
            </p>
          )}

          {checkedAnswer.explanation && (
            <p className="text-sm font-medium">{checkedAnswer.explanation}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
