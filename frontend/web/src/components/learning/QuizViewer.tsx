"use client";

import { useState, useCallback } from "react";
import type { QuizData } from "@/lib/types";

interface QuizViewerProps {
  quiz: QuizData;
}

export default function QuizViewer({ quiz }: QuizViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);

  const question = quiz.questions[currentIndex];
  const total = quiz.questions.length;

  const goNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  }, [currentIndex, total]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setSelectedAnswer(null);
      setRevealed(false);
    }
  }, [currentIndex]);

  function getOptionStyle(option: string): string {
    const base =
      "w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500";

    if (!revealed) {
      if (selectedAnswer === option) {
        return `${base} border-primary-500 bg-primary-50 text-primary-800`;
      }
      return `${base} border-gray-200 bg-white text-gray-800 hover:border-primary-300 hover:bg-primary-50`;
    }

    // Revealed state
    if (option === question.correctAnswer) {
      return `${base} border-green-500 bg-green-50 text-green-800`;
    }
    if (selectedAnswer === option && option !== question.correctAnswer) {
      return `${base} border-red-400 bg-red-50 text-red-800`;
    }
    return `${base} border-gray-200 bg-white text-gray-500`;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Progress header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">
          Soal <span className="text-primary-700 font-bold">{currentIndex + 1}</span> dari{" "}
          <span className="font-bold">{total}</span>
        </span>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
          {quiz.topicSlug.replace(/-/g, " ")}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Question card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {/* Optional image */}
        {question.imageUrl && (
          <div className="mb-5 rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={question.imageUrl}
              alt={`Gambar untuk soal ${currentIndex + 1}`}
              className="w-full max-h-56 object-contain"
            />
          </div>
        )}

        {/* Optional audio */}
        {question.audioUrl && (
          <div className="mb-5">
            <p className="text-xs text-gray-500 mb-2 font-medium">🎧 Audio soal:</p>
            <audio
              src={question.audioUrl}
              controls
              className="w-full h-10 accent-primary-600"
              aria-label="Audio untuk soal ini"
            />
          </div>
        )}

        {/* Question text */}
        <p className="text-base font-semibold text-gray-900 leading-relaxed mb-6">
          {question.questionText}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Pilihan jawaban">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => !revealed && setSelectedAnswer(option)}
              disabled={revealed}
              className={getOptionStyle(option)}
              role="radio"
              aria-checked={selectedAnswer === option}
            >
              <span className="inline-flex items-center gap-3">
                <span className="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 border-current">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
                {revealed && option === question.correctAnswer && (
                  <span className="ml-auto text-green-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {!revealed && selectedAnswer && (
          <button
            onClick={() => setRevealed(true)}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-accent-500 text-white text-sm font-semibold hover:bg-accent-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
          >
            Lihat Jawaban
          </button>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl border-2 border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            ← Sebelumnya
          </button>
          <button
            onClick={goNext}
            disabled={currentIndex === total - 1}
            className="flex-1 sm:flex-none px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Berikutnya →
          </button>
        </div>
      </div>

      {/* Completed state */}
      {currentIndex === total - 1 && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-green-800">🎉 Kamu sudah menyelesaikan semua soal di sesi ini!</p>
        </div>
      )}
    </div>
  );
}
