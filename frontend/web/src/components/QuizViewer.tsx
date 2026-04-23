/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Question } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ArrowRight, ArrowLeft, RefreshCcw, Volume2 } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface QuizViewerProps {
  questions: Question[];
}

export default function QuizViewer({ questions }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [complete, setComplete] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (option: string) => {
    setAnswers({ ...answers, [currentIndex]: option });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setComplete(true);
    }
  };

  const reset = () => {
    setCurrentIndex(0);
    setAnswers({});
    setComplete(false);
  };

  if (complete) {
    const score = Object.entries(answers).reduce((acc, [idx, ans]) => {
      return ans === questions[parseInt(idx)].correctAnswer ? acc + 1 : acc;
    }, 0);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-10 text-center"
      >
        <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
           <CheckCircle2 size={48} />
        </div>
        <h2 className="text-4xl font-bold text-slate-800 mb-4 tracking-tight">Kuis Selesai!</h2>
        <p className="text-xl text-slate-500 font-medium mb-10">
          Kamu menjawab <span className="text-indigo-600 font-bold">{score} dari {questions.length}</span> pertanyaan dengan benar.
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
      {/* Header Info */}
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Quiz Mode</span>
          <h2 className="font-bold text-slate-800 text-sm">Latihan Sesi {currentIndex + 1}</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 font-medium">Pertanyaan <span className="text-indigo-600">{currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}</span> dari {questions.length}</div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Question Area */}
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center overflow-auto">
        <motion.div
           key={currentIndex}
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           className="w-full max-w-2xl"
        >
          <div className="mb-8 p-8 bg-slate-50 rounded-xl border border-slate-100 w-full">
            <span className="text-xs text-slate-400 font-bold mb-2 block uppercase tracking-wider">Pilih jawaban yang benar</span>

            {/* Question image */}
            {currentQuestion.image && (
              <div className="mb-6">
                <img
                  src={currentQuestion.image}
                  alt="Gambar soal"
                  className="mx-auto max-h-56 rounded-xl object-cover border border-slate-200 shadow-sm"
                />
              </div>
            )}

            {/* Question audio */}
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
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                className={cn(
                  "p-6 rounded-xl border-2 transition-all text-left group flex items-center gap-4",
                  answers[currentIndex] === option
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-slate-200 hover:border-indigo-500 hover:bg-slate-50"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                  answers[currentIndex] === option 
                    ? "bg-indigo-600 text-white" 
                    : "bg-slate-100 text-slate-500 group-hover:bg-indigo-200 group-hover:text-indigo-600"
                )}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-bold text-slate-800">{option}</span>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer Navigation */}
      <div className="p-6 border-t border-slate-100 flex items-center justify-between">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex(currentIndex - 1)}
          className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Sebelumnya
        </button>
        
        <div className="hidden sm:flex gap-2">
          {questions.map((_, i) => (
            <button
               key={i}
               onClick={() => setCurrentIndex(i)}
               className={cn(
                 "w-8 h-8 rounded text-[10px] font-bold transition-colors",
                 currentIndex === i ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
               )}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <button
          disabled={!answers[currentIndex]}
          onClick={handleNext}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 flex items-center gap-2 shadow-sm shadow-indigo-100 transition-all"
        >
          {currentIndex === questions.length - 1 ? 'Selesaikan' : 'Selanjutnya'}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
