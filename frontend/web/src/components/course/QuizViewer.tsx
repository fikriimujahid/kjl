'use client';

import type { Question } from '@/types/product';
import type { QuizMode } from '@/types/quiz';
import { useQuizSession } from '@/hooks/useQuizSession';
import { QuizCompletionView } from '@/components/course/quiz/QuizCompletionView';
import { QuizFooter } from '@/components/course/quiz/QuizFooter';
import { QuizQuestionPanel } from '@/components/course/quiz/QuizQuestionPanel';

interface QuizViewerProps {
  mode: QuizMode;
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  accessToken?: string;
}

export default function QuizViewer({
  mode,
  questions,
  productId,
  topicId,
  sessionId,
  accessToken,
}: QuizViewerProps) {
  const quiz = useQuizSession({
    mode,
    questions,
    productId,
    topicId,
    sessionId,
    accessToken,
  });

  if (questions.length === 0) {
    return (
      <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Kuis Belum Tersedia</h2>
        <p className="text-slate-500 font-medium">Data pertanyaan untuk sesi ini belum bisa dimuat.</p>
      </div>
    );
  }

  if (quiz.isComplete && quiz.result) {
    return <QuizCompletionView mode={mode} result={quiz.result} onReset={quiz.reset} />;
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
            {quiz.isPracticeMode ? 'Practice Mode' : 'Quiz Mode'}
          </span>
          <h2 className="font-bold text-slate-800 text-sm">Latihan Sesi {quiz.currentIndex + 1}</h2>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 font-medium">
            Pertanyaan <span className="text-indigo-600">{quiz.currentIndex + 1 < 10 ? `0${quiz.currentIndex + 1}` : quiz.currentIndex + 1}</span> dari {questions.length}
          </div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((quiz.currentIndex + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center text-center overflow-auto">
        <QuizQuestionPanel
          question={quiz.currentQuestion}
          currentIndex={quiz.currentIndex}
          answer={quiz.answers[quiz.currentIndex]}
          isPracticeMode={quiz.isPracticeMode}
          isCurrentAnswerChecked={quiz.isCurrentAnswerChecked}
          checkedAnswer={quiz.currentCheckedAnswer}
          onSelectAnswer={quiz.selectAnswer}
        />
      </div>

      <QuizFooter
        currentIndex={quiz.currentIndex}
        totalQuestions={questions.length}
        answers={quiz.answers}
        isSubmitting={quiz.isSubmitting}
        submitError={quiz.submitError}
        actionLabel={quiz.actionLabel}
        onPrev={quiz.goPrevious}
        onJump={quiz.goToQuestion}
        onPrimaryAction={() => {
          void quiz.handlePrimaryAction();
        }}
      />
    </div>
  );
}
