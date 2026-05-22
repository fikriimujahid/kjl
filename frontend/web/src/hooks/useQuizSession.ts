'use client';

import { useMemo, useState } from 'react';
import type { Question } from '@/types/product';
import type { LearningSessionAnswerCheckResult } from '@/services/learning/learningApi';
import { checkLearningSessionAnswer } from '@/services/learning/learningApi';
import type { QuizMode, QuizResult, QuizResultDetail, SelectedAnswer } from '@/types/quiz';

interface UseQuizSessionOptions {
  mode: QuizMode;
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  accessToken?: string;
}

interface UseQuizSessionResult {
  currentIndex: number;
  currentQuestion: Question;
  answers: Record<number, SelectedAnswer>;
  checkedAnswers: Record<number, LearningSessionAnswerCheckResult>;
  isSubmitting: boolean;
  submitError: string | null;
  result: QuizResult | null;
  isPracticeMode: boolean;
  isComplete: boolean;
  isOnLastQuestion: boolean;
  isCurrentAnswerChecked: boolean;
  currentCheckedAnswer: LearningSessionAnswerCheckResult | undefined;
  actionLabel: string;
  selectAnswer: (option: string, optionId: string) => void;
  handlePrimaryAction: () => Promise<void>;
  goPrevious: () => void;
  goToQuestion: (index: number) => void;
  reset: () => void;
}

const PASSING_SCORE = 70;

function buildSummaryResult(details: QuizResultDetail[], totalQuestions: number): QuizResult {
  const obtainedScore = details.reduce((total, detail) => total + detail.awardedScore, 0);
  const maxScore = details.reduce((total, detail) => total + detail.score, 0);
  const percentage = maxScore === 0
    ? 0
    : Math.round((obtainedScore / maxScore) * 100);

  return {
    details,
    totalQuestions,
    maxScore,
    obtainedScore,
    percentage,
    passingScore: PASSING_SCORE,
    passed: percentage >= PASSING_SCORE,
  };
}

export function useQuizSession({
  mode,
  questions,
  productId,
  topicId,
  sessionId,
  accessToken,
}: UseQuizSessionOptions): UseQuizSessionResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, SelectedAnswer>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, LearningSessionAnswerCheckResult>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);

  const currentQuestion = questions[currentIndex];
  const isPracticeMode = mode === 'practice';
  const isComplete = result !== null;
  const isOnLastQuestion = currentIndex === questions.length - 1;
  const currentCheckedAnswer = checkedAnswers[currentIndex];
  const isCurrentAnswerChecked = Boolean(currentCheckedAnswer);

  const actionLabel = useMemo(() => {
    if (isPracticeMode) {
      if (!isCurrentAnswerChecked) {
        return 'Cek Jawaban';
      }

      return isOnLastQuestion ? 'Selesaikan' : 'Selanjutnya';
    }

    if (isOnLastQuestion) {
      return isSubmitting ? 'Mengirim...' : 'Selesaikan';
    }

    return 'Selanjutnya';
  }, [isCurrentAnswerChecked, isOnLastQuestion, isPracticeMode, isSubmitting]);

  const selectAnswer = (option: string, optionId: string) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [currentIndex]: {
        option,
        optionId,
      },
    }));

    setCheckedAnswers((currentCheckedAnswers) => {
      const updatedCheckedAnswers = { ...currentCheckedAnswers };
      delete updatedCheckedAnswers[currentIndex];
      return updatedCheckedAnswers;
    });

    setSubmitError(null);
  };

  const submitExamDummy = async () => {
    const answeredCount = questions.reduce((count, _, index) => count + (answers[index] ? 1 : 0), 0);

    if (answeredCount === 0) {
      setSubmitError('Jawaban belum tersedia untuk dikirim.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const details: QuizResultDetail[] = questions.map((question, index) => {
        const selectedAnswer = answers[index];
        const fallbackOptionId = question.optionIds?.[0] ?? '';
        const correctAnswer = question.correctAnswer || fallbackOptionId;

        if (!selectedAnswer) {
          return {
            questionId: question.id,
            selectedOptionId: '',
            isCorrect: false,
            score: 1,
            awardedScore: 0,
          };
        }

        const isCorrect = correctAnswer.length === 0
          ? true
          : selectedAnswer.optionId === correctAnswer;

        return {
          questionId: question.id,
          selectedOptionId: selectedAnswer.optionId,
          isCorrect,
          score: 1,
          awardedScore: isCorrect ? 1 : 0,
        };
      });

      setResult(buildSummaryResult(details, questions.length));
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkPracticeAnswer = async () => {
    const selectedAnswer = answers[currentIndex];

    if (!selectedAnswer) {
      setSubmitError('Pilih jawaban terlebih dahulu.');
      return;
    }

    if (!accessToken) {
      setSubmitError('Sesi login tidak ditemukan. Silakan login ulang.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const checkResult = await checkLearningSessionAnswer({
        productId,
        topicId,
        sessionId,
        questionId: currentQuestion.id,
        selectedOptionId: selectedAnswer.optionId,
        accessToken,
      });

      if (!checkResult) {
        setSubmitError('Gagal memeriksa jawaban. Silakan coba lagi.');
        return;
      }

      setCheckedAnswers((currentCheckedAnswers) => ({
        ...currentCheckedAnswers,
        [currentIndex]: checkResult,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const finishPractice = () => {
    const details: QuizResultDetail[] = questions.map((question, index) => {
      const checkedAnswer = checkedAnswers[index];
      const selectedAnswer = answers[index];

      if (!checkedAnswer) {
        return {
          questionId: question.id,
          selectedOptionId: selectedAnswer?.optionId ?? '',
          isCorrect: false,
          score: 0,
          awardedScore: 0,
        };
      }

      return {
        questionId: checkedAnswer.questionId,
        selectedOptionId: checkedAnswer.selectedOptionId,
        isCorrect: checkedAnswer.isCorrect,
        score: checkedAnswer.score,
        awardedScore: checkedAnswer.awardedScore,
      };
    });

    setResult(buildSummaryResult(details, questions.length));
  };

  const handlePrimaryAction = async () => {
    if (isPracticeMode) {
      if (!isCurrentAnswerChecked) {
        await checkPracticeAnswer();
        return;
      }

      if (!isOnLastQuestion) {
        setCurrentIndex((index) => index + 1);
        return;
      }

      finishPractice();
      return;
    }

    if (!isOnLastQuestion) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    await submitExamDummy();
  };

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const reset = () => {
    setCurrentIndex(0);
    setAnswers({});
    setCheckedAnswers({});
    setIsSubmitting(false);
    setSubmitError(null);
    setResult(null);
  };

  return {
    currentIndex,
    currentQuestion,
    answers,
    checkedAnswers,
    isSubmitting,
    submitError,
    result,
    isPracticeMode,
    isComplete,
    isOnLastQuestion,
    isCurrentAnswerChecked,
    currentCheckedAnswer,
    actionLabel,
    selectAnswer,
    handlePrimaryAction,
    goPrevious,
    goToQuestion,
    reset,
  };
}
