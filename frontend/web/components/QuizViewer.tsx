'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, ArrowRight, ArrowLeft, RefreshCcw, Volume2 } from 'lucide-react';
import { Question } from '@/lib/types';
import { submitQuizExam, SubmitQuizExamResponse } from '@/lib/quiz';
import { cn } from '@/lib/utils';

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

interface QuizViewerProps {
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  accessToken?: string;
}

interface SelectedAnswer {
  option: string;
  optionId: string;
}

export default function QuizViewer({
  questions,
  productId,
  topicId,
  sessionId,
  accessToken,
}: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, SelectedAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitQuizExamResponse | null>(null);

  if (questions.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Kuis Belum Tersedia</h2>
        <p className="text-slate-500 font-medium">Data pertanyaan untuk sesi ini belum bisa dimuat.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const complete = result !== null;

  const handleSelect = (option: string, optionId: string) => {
    setAnswers({
      ...answers,
      [currentIndex]: {
        option,
        optionId,
      },
    });
    setSubmitError(null);
  };

  const submitQuiz = async () => {
    if (!accessToken) {
      setSubmitError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }

    if (!productId || !topicId || !sessionId) {
      setSubmitError('Konteks kuis tidak lengkap. Muat ulang sesi dan coba lagi.');
      return;
    }

    const answerPayload = questions
      .map((question, index) => {
        const selectedAnswer = answers[index];
        if (!selectedAnswer) {
          return null;
        }

        return {
          questionId: question.id,
          selectedOptionId: selectedAnswer.optionId,
        };
      })
      .filter((item): item is { questionId: string; selectedOptionId: string } => item !== null);

    if (answerPayload.length === 0) {
      setSubmitError('Jawaban belum tersedia untuk dikirim.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const submitResult = await submitQuizExam({
        productId,
        topicId,
        sessionId,
        answers: answerPayload,
        accessToken,
      });

      setResult(submitResult);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Gagal mengirim hasil kuis');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await submitQuiz();
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setAnswers({});
    setIsSubmitting(false);
    setSubmitError(null);
    setResult(null);
  };

  if (complete) {
    const correctCount = result.details.filter((detail) => detail.isCorrect).length;
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
            onClick={reset}
            className="px-8 py-4 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2"
          >
            <RefreshCcw size={18} /> Ulangi Kuis
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Quiz Mode</span>
          <h2 className="font-bold text-slate-800 text-sm">Latihan Sesi {currentIndex + 1}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 font-medium">Pertanyaan <span className="text-indigo-600">{currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}</span> dari {questions.length}</div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center overflow-auto">
        <motion.div key={currentIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
          <div className="mb-8 p-8 bg-slate-50 rounded-xl border border-slate-100 w-full">
            <span className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">Pilih jawaban yang benar</span>

            {currentQuestion.image && (
              <div className="mb-6">
                <img
                  src={currentQuestion.image}
                  alt="Gambar soal"
                  className="mx-auto max-h-56 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
              </div>
            )}

            {currentQuestion.audio && (
              <div className="mb-6 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">
                  <Volume2 size={14} /> Dengarkan audio berikut
                </div>
                <audio controls className="w-full max-w-sm rounded-lg">
                  <source src={currentQuestion.audio} type="audio/mpeg" />
                </audio>
              </div>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">{currentQuestion.text}</h1>
            <p className="text-lg text-slate-600 font-medium">Klik pada salah satu opsi di bawah ini</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {currentQuestion.options.map((option, idx) => {
              const optionId =
                currentQuestion.optionIds?.[idx] ??
                `opt${String.fromCharCode(65 + idx)}`;
              const isSelected = answers[currentIndex]?.optionId === optionId;

              return (
              <button
                key={idx}
                onClick={() => handleSelect(option, optionId)}
                className={cn(
                  'p-6 rounded-xl border-2 transition-all text-left group flex items-center gap-4',
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
            )})}
          </div>
        </motion.div>
      </div>

      <div className="p-6 border-t border-slate-100 flex items-center justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Sebelumnya
        </button>

        <div className="hidden sm:flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            {getPaginationItems(currentIndex, questions.length).map((item, i) =>
              item === '...' ? (
                <span key={`ellipsis-${i}`} className="w-7 h-7 flex items-center justify-center text-slate-400 text-xs select-none">…</span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentIndex(item as number)}
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
            onClick={handleNext}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-100 transition-all disabled:opacity-50"
          >
            {currentIndex === questions.length - 1
              ? isSubmitting
                ? 'Mengirim...'
                : 'Selesaikan'
              : 'Selanjutnya'}
            <ArrowRight size={16} />
          </button>

          {submitError && <p className="text-xs text-red-500 font-semibold">{submitError}</p>}
        </div>
      </div>
    </div>
  );
}