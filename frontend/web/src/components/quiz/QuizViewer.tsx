'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Question } from '@/types/product';
import type { QuizMode } from '@/types/quiz';
import { useQuizSession } from '@/hooks/useQuizSession';
import { QuizCompletionView } from '@/components/quiz/QuizCompletionView';
import { QuizQuestionPanel } from '@/components/quiz/QuizQuestionPanel';
import { QuizSidebarPanel } from '@/components/quiz/QuizSidebarPanel';
import { QuizViewerBottomBar } from '@/components/quiz/viewer/QuizViewerBottomBar';
import { QuizViewerEmptyState } from '@/components/quiz/viewer/QuizViewerEmptyState';
import { QuizViewerMobileSidebar } from '@/components/quiz/viewer/QuizViewerMobileSidebar';
import { QuizViewerTopBar } from '@/components/quiz/viewer/QuizViewerTopBar';

interface QuizViewerProps {
  mode: QuizMode;
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId?: string;
  accessToken?: string;
  durationMinutes?: number;
}

export default function QuizViewer({
  mode,
  questions,
  productId,
  topicId,
  sessionId,
  attemptId,
  accessToken,
  durationMinutes,
}: QuizViewerProps) {
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const quiz = useQuizSession({
    mode,
    questions,
    productId,
    topicId,
    sessionId,
    attemptId,
    accessToken,
    durationMinutes,
  });

  if (questions.length === 0) {
    return <QuizViewerEmptyState />;
  }

  const handleBackToMaterial = () => {
    const params = new URLSearchParams({
      productId,
      topicId,
      sessionId,
    });

    router.push(`/course?${params.toString()}`);
  };

  if (quiz.isComplete && quiz.result) {
    return (
      <QuizCompletionView
        mode={mode}
        result={quiz.result}
        onBackToMaterial={handleBackToMaterial}
      />
    );
  }

  const isBookmarked = quiz.bookmarkedIndexes.has(quiz.currentIndex);
  const answeredCount = questions.filter((_, i) => Boolean(quiz.answers[i])).length;
  const progressPercent = Math.round((answeredCount / questions.length) * 100);
  const canRunPrimaryAction = Boolean(quiz.currentAnswer) || quiz.isCurrentAnswerChecked;

  const handleJumpToQuestion = (index: number) => {
    quiz.goToQuestion(index);
    setMobileSidebarOpen(false);
  };

  const sidebarProps = {
    totalQuestions: questions.length,
    currentIndex: quiz.currentIndex,
    answers: quiz.answers,
    bookmarkedIndexes: quiz.bookmarkedIndexes,
    checkedAnswers: quiz.checkedAnswers,
    isPracticeMode: quiz.isPracticeMode,
    onJump: handleJumpToQuestion,
  };

  return (
    <div className="flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden min-h-[680px]">
      <div className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col">
        <QuizSidebarPanel {...sidebarProps} />
      </div>

      <QuizViewerMobileSidebar
        isOpen={mobileSidebarOpen}
        totalQuestions={questions.length}
        currentIndex={quiz.currentIndex}
        answers={quiz.answers}
        bookmarkedIndexes={quiz.bookmarkedIndexes}
        checkedAnswers={quiz.checkedAnswers}
        isPracticeMode={quiz.isPracticeMode}
        onClose={() => setMobileSidebarOpen(false)}
        onJump={handleJumpToQuestion}
      />

      <div className="flex-1 flex flex-col min-w-0 border-l border-slate-100">
        <QuizViewerTopBar
          isPracticeMode={quiz.isPracticeMode}
          currentIndex={quiz.currentIndex}
          totalQuestions={questions.length}
          answeredCount={answeredCount}
          progressPercent={progressPercent}
          timerDisplay={quiz.timerDisplay}
          timerIsLow={quiz.timerIsLow}
          isBookmarked={isBookmarked}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
          onToggleBookmark={() => quiz.toggleBookmark(quiz.currentIndex)}
        />

        <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-10">
          <QuizQuestionPanel
            question={quiz.currentQuestion}
            currentIndex={quiz.currentIndex}
            answer={quiz.currentAnswer}
            isPracticeMode={quiz.isPracticeMode}
            isCurrentAnswerChecked={quiz.isCurrentAnswerChecked}
            checkedAnswer={quiz.currentCheckedAnswer}
            onSelectAnswer={quiz.selectAnswer}
          />
        </div>

        <QuizViewerBottomBar
          currentIndex={quiz.currentIndex}
          totalQuestions={questions.length}
          isSubmitting={quiz.isSubmitting}
          submitError={quiz.submitError}
          isPracticeMode={quiz.isPracticeMode}
          actionLabel={quiz.actionLabel}
          canRunPrimaryAction={canRunPrimaryAction}
          onPrevious={quiz.goPrevious}
          onPrimaryAction={() => {
            void quiz.handlePrimaryAction();
          }}
        />
      </div>
    </div>
  );
}
