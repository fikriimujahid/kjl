'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Question } from '@/types/product';
import type {
  FinishLearningSessionAttemptResponse,
  LearningSessionAttemptEvaluationDetail,
  LearningSessionAnswerCheckResult,
  LearningSessionAttempt,
  LearningSessionFinishAnswerInput,
  LearningSessionProgressCheckedAnswer,
} from '@/services/learning/learningApi';
import {
  checkLearningSessionAnswer,
  fetchLearningSessionAttemptProgress,
  finishLearningSessionAttempt,
  saveLearningSessionAttemptProgress,
} from '@/services/learning/learningApi';
import type { QuizMode, QuizResult, QuizResultDetail, SelectedAnswer } from '@/types/quiz';

interface UseQuizSessionOptions {
  mode: QuizMode;
  questions: Question[];
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId?: string;
  accessToken?: string;
  durationMinutes?: number;
}

interface UseQuizSessionResult {
  currentIndex: number;
  currentQuestion: Question;
  currentAnswer: SelectedAnswer | undefined;
  answers: Record<number, SelectedAnswer>;
  checkedAnswers: Record<number, LearningSessionAnswerCheckResult>;
  bookmarkedIndexes: Set<number>;
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
  toggleBookmark: (index: number) => void;
  timerDisplay: string;
  timerIsLow: boolean;
  reset: () => void;
}

function formatSecondsToTimer(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function mapEvaluationDetailToQuizResultDetail(detail: LearningSessionAttemptEvaluationDetail): QuizResultDetail {
  return {
    questionId: detail.questionId,
    selectedOptionId: detail.selectedOptionId,
    isCorrect: detail.isCorrect,
    score: detail.score,
    awardedScore: detail.awardedScore,
  };
}

function buildQuizResultFromFinishResponse(
  response: FinishLearningSessionAttemptResponse,
): QuizResult | null {
  if (response.evaluation) {
    const { evaluation } = response;

    return {
      details: evaluation.details.map(mapEvaluationDetailToQuizResultDetail),
      totalQuestions: evaluation.totalQuestions,
      correctAnswers: evaluation.correctAnswers,
      wrongAnswers: evaluation.wrongAnswers,
      maxScore: evaluation.maxScore,
      obtainedScore: evaluation.obtainedScore,
      percentage: evaluation.percentage,
      passingScore: evaluation.passingScore,
      passed: evaluation.passed,
    };
  }

  const {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    maxScore,
    obtainedScore,
    percentage,
    passingScore,
    passed,
  } = response.attempt;

  if (
    totalQuestions == null
    || correctAnswers == null
    || maxScore == null
    || obtainedScore == null
    || percentage == null
    || passingScore == null
    || passed == null
  ) {
    return null;
  }

  return {
    details: [],
    totalQuestions,
    correctAnswers,
    wrongAnswers: wrongAnswers ?? Math.max(totalQuestions - correctAnswers, 0),
    maxScore,
    obtainedScore,
    percentage,
    passingScore,
    passed,
  };
}

function buildFinishAnswers(
  questions: Question[],
  effectiveAnswers: Record<number, SelectedAnswer>,
): LearningSessionFinishAnswerInput[] {
  return questions.map((question, index) => ({
    questionId: question.id,
    selectedOptionId: effectiveAnswers[index]?.optionId ?? '',
  }));
}

function parseIndex(key: string): number | null {
  const parsed = Number.parseInt(key, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function restoreAnswersFromAttemptProgress(
  attempt: LearningSessionAttempt,
  maxQuestionIndex: number,
): Record<number, SelectedAnswer> {
  const restored: Record<number, SelectedAnswer> = {};
  const progressAnswers = attempt.progressAnswers ?? {};

  for (const [key, answer] of Object.entries(progressAnswers)) {
    const index = parseIndex(key);
    if (index === null || index > maxQuestionIndex) {
      continue;
    }

    restored[index] = {
      option: answer.option,
      optionId: answer.optionId,
    };
  }

  return restored;
}

function restoreCheckedAnswersFromAttemptProgress(
  attempt: LearningSessionAttempt,
  maxQuestionIndex: number,
  productId: string,
  topicId: string,
  sessionId: string,
): Record<number, LearningSessionAnswerCheckResult> {
  const restored: Record<number, LearningSessionAnswerCheckResult> = {};
  const progressCheckedAnswers = attempt.progressCheckedAnswers ?? {};

  for (const [key, checkedAnswer] of Object.entries(progressCheckedAnswers)) {
    const index = parseIndex(key);
    if (index === null || index > maxQuestionIndex) {
      continue;
    }

    restored[index] = {
      productId,
      topicId,
      sessionId,
      questionId: checkedAnswer.questionId,
      selectedOptionId: checkedAnswer.selectedOptionId,
      correctAnswer: checkedAnswer.correctAnswer,
      isCorrect: checkedAnswer.isCorrect,
      score: checkedAnswer.score,
      awardedScore: checkedAnswer.awardedScore,
      explanation: checkedAnswer.explanation,
    };
  }

  return restored;
}

export function useQuizSession({
  mode,
  questions,
  productId,
  topicId,
  sessionId,
  attemptId,
  accessToken,
  durationMinutes,
}: UseQuizSessionOptions): UseQuizSessionResult {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswers, setDraftAnswers] = useState<Record<number, SelectedAnswer>>({});
  const [answers, setAnswers] = useState<Record<number, SelectedAnswer>>({});
  const [checkedAnswers, setCheckedAnswers] = useState<Record<number, LearningSessionAnswerCheckResult>>({});
  const [bookmarkedIndexes, setBookmarkedIndexes] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const attemptStartedAtMsRef = useRef<number>(Date.now());
  const hasHydratedProgressRef = useRef(false);
  const [, setTimerTick] = useState(0);
  const hasAutoSubmittedRef = useRef(false);
  const submitExamRef = useRef<((forced?: boolean) => Promise<void>) | null>(null);
  const durationSeconds = durationMinutes != null && durationMinutes > 0 ? durationMinutes * 60 : null;

  useEffect(() => {
    attemptStartedAtMsRef.current = Date.now();
    hasAutoSubmittedRef.current = false;
  }, [attemptId]);

  useEffect(() => {
    hasHydratedProgressRef.current = false;

    if (!attemptId || !accessToken) {
      hasHydratedProgressRef.current = true;
      return;
    }

    const controller = new AbortController();

    void fetchLearningSessionAttemptProgress({
      productId,
      topicId,
      sessionId,
      attemptId,
      accessToken,
      signal: controller.signal,
    })
      .then((progressResponse) => {
        if (controller.signal.aborted || !progressResponse) {
          return;
        }

        const currentAttempt = progressResponse.attempt;

        const maxQuestionIndex = Math.max(questions.length - 1, 0);
        const restoredCurrentIndex = Math.min(
          Math.max(currentAttempt.progressCurrentQuestionIndex ?? 0, 0),
          maxQuestionIndex,
        );

        const restoredAnswers = restoreAnswersFromAttemptProgress(currentAttempt, maxQuestionIndex);
        const restoredCheckedAnswers = restoreCheckedAnswersFromAttemptProgress(
          currentAttempt,
          maxQuestionIndex,
          productId,
          topicId,
          sessionId,
        );

        setCurrentIndex(restoredCurrentIndex);
        setDraftAnswers(restoredAnswers);
        setAnswers(restoredAnswers);
        setCheckedAnswers(restoredCheckedAnswers);
        setBookmarkedIndexes(new Set(currentAttempt.progressBookmarkedIndexes ?? []));

        if (typeof currentAttempt.progressDurationSeconds === 'number' && currentAttempt.progressDurationSeconds >= 0) {
          attemptStartedAtMsRef.current = Date.now() - (currentAttempt.progressDurationSeconds * 1000);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          hasHydratedProgressRef.current = true;
        }
      });

    return () => {
      controller.abort();
    };
  }, [attemptId, accessToken, productId, topicId, sessionId, questions.length]);

  // Timer tick – forces re-renders every second so derived timer values update.
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => {
      setTimerTick((t) => t + 1);
      // Auto-submit exam when countdown reaches zero
      if (mode === 'exam' && durationSeconds !== null && !hasAutoSubmittedRef.current && submitExamRef.current) {
        const elapsed = Math.max(0, Math.floor((Date.now() - attemptStartedAtMsRef.current) / 1000));
        if (elapsed >= durationSeconds) {
          hasAutoSubmittedRef.current = true;
          void submitExamRef.current(true);
        }
      }
    }, 1000);
    return () => clearInterval(id);
  }, [result, mode, durationSeconds]);
  const currentQuestion = questions[currentIndex];
  const isPracticeMode = mode === 'practice';
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - attemptStartedAtMsRef.current) / 1000));
  const remainingSeconds = durationSeconds !== null ? Math.max(0, durationSeconds - elapsedSeconds) : null;
  const timerDisplay = isPracticeMode
    ? formatSecondsToTimer(elapsedSeconds)
    : remainingSeconds !== null
      ? formatSecondsToTimer(remainingSeconds)
      : '--:--';
  const timerIsLow = !isPracticeMode && remainingSeconds !== null && remainingSeconds <= 300;
  const isComplete = result !== null;
  const isOnLastQuestion = currentIndex === questions.length - 1;
  const currentAnswer = draftAnswers[currentIndex] ?? answers[currentIndex];
  const currentCheckedAnswer = checkedAnswers[currentIndex];
  const isCurrentAnswerChecked = Boolean(currentCheckedAnswer);

  const actionLabel = useMemo(() => {
    if (isPracticeMode) {
      if (!isCurrentAnswerChecked) {
        return 'Periksa Jawaban';
      }

      return isOnLastQuestion ? 'Selesaikan' : 'Selanjutnya';
    }

    if (isOnLastQuestion) {
      return isSubmitting ? 'Mengirim...' : 'Selesaikan';
    }

    return 'Selanjutnya';
  }, [isCurrentAnswerChecked, isOnLastQuestion, isPracticeMode, isSubmitting]);

  const selectAnswer = (option: string, optionId: string) => {
    setDraftAnswers((currentDraftAnswers) => ({
      ...currentDraftAnswers,
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

  const toProgressAnswers = (sourceAnswers: Record<number, SelectedAnswer>): Record<string, SelectedAnswer> => {
    return Object.entries(sourceAnswers).reduce<Record<string, SelectedAnswer>>((acc, [index, answer]) => {
      acc[index] = {
        option: answer.option,
        optionId: answer.optionId,
      };
      return acc;
    }, {});
  };

  const toProgressCheckedAnswers = (sourceCheckedAnswers: Record<number, LearningSessionAnswerCheckResult>): Record<string, LearningSessionProgressCheckedAnswer> => {
    return Object.entries(sourceCheckedAnswers).reduce<Record<string, LearningSessionProgressCheckedAnswer>>((acc, [index, answer]) => {
      acc[index] = {
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        correctAnswer: answer.correctAnswer,
        isCorrect: answer.isCorrect,
        score: answer.score,
        awardedScore: answer.awardedScore,
        explanation: answer.explanation,
      };
      return acc;
    }, {});
  };

  const persistProgress = async (
    committedAnswers: Record<number, SelectedAnswer>,
    persistedCurrentQuestionIndex: number,
  ): Promise<boolean> => {
    if (!attemptId || !accessToken || result || !hasHydratedProgressRef.current) {
      return true;
    }

    const progressAnswers = toProgressAnswers(committedAnswers);
    const progressCheckedAnswers = toProgressCheckedAnswers(checkedAnswers);
    const answeredQuestionIndexes = Object.keys(progressAnswers)
      .map((index) => Number.parseInt(index, 10))
      .filter((index) => Number.isInteger(index) && index >= 0)
      .sort((a, b) => a - b);
    const bookmarkedIndexList = Array.from(bookmarkedIndexes.values()).sort((a, b) => a - b);
    const elapsedDurationSeconds = Math.max(0, Math.round((Date.now() - attemptStartedAtMsRef.current) / 1000));

    const saveResult = await saveLearningSessionAttemptProgress({
      productId,
      topicId,
      sessionId,
      attemptId,
      currentQuestionIndex: Math.max(persistedCurrentQuestionIndex, 0),
      answeredQuestionIndexes,
      answers: progressAnswers,
      checkedAnswers: progressCheckedAnswers,
      bookmarkedIndexes: bookmarkedIndexList,
      durationSeconds: elapsedDurationSeconds,
      accessToken,
    });

    return saveResult !== null;
  };

  const commitCurrentAnswer = (): Record<number, SelectedAnswer> => {
    if (!currentAnswer) {
      return answers;
    }

    return {
      ...answers,
      [currentIndex]: currentAnswer,
    };
  };

  const submitExam = async (_forced = false) => {
    if (!attemptId || !accessToken) {
      setSubmitError('Sesi kuis tidak ditemukan. Silakan mulai ulang dari materi.');
      return;
    }

    const effectiveAnswers = {
      ...answers,
      ...draftAnswers,
    };

    const finishAnswers = buildFinishAnswers(questions, effectiveAnswers);

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const durationSeconds = Math.max(0, Math.round((Date.now() - attemptStartedAtMsRef.current) / 1000));
      const finishResponse = await finishLearningSessionAttempt({
        productId,
        topicId,
        sessionId,
        attemptId,
        answers: finishAnswers,
        durationSeconds,
        accessToken,
      });

      if (!finishResponse) {
        setSubmitError('Gagal menyelesaikan sesi. Silakan coba lagi.');
        return;
      }

      const nextResult = buildQuizResultFromFinishResponse(finishResponse);

      if (!nextResult) {
        setSubmitError('Respons hasil kuis tidak valid. Silakan coba lagi.');
        return;
      }

      setResult(nextResult);
    } finally {
      setIsSubmitting(false);
    }
  };

  submitExamRef.current = submitExam;

  const checkPracticeAnswer = async () => {
    const selectedAnswer = currentAnswer;

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

  const handlePrimaryAction = async () => {
    if (isPracticeMode) {
      if (!isCurrentAnswerChecked) {
        await checkPracticeAnswer();
        return;
      }

      if (!isOnLastQuestion) {
        const nextIndex = currentIndex + 1;
        const committedAnswers = commitCurrentAnswer();

        setIsSubmitting(true);
        setSubmitError(null);

        try {
          const hasSaved = await persistProgress(committedAnswers, nextIndex);
          if (!hasSaved) {
            setSubmitError('Gagal menyimpan progres. Coba lagi.');
            return;
          }

          setAnswers(committedAnswers);
          setCurrentIndex(nextIndex);
        } finally {
          setIsSubmitting(false);
        }

        return;
      }

      await submitExam();
      return;
    }

    if (!isOnLastQuestion) {
      const nextIndex = currentIndex + 1;
      const committedAnswers = commitCurrentAnswer();

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const hasSaved = await persistProgress(committedAnswers, nextIndex);
        if (!hasSaved) {
          setSubmitError('Gagal menyimpan progres. Coba lagi.');
          return;
        }

        setAnswers(committedAnswers);
        setCurrentIndex(nextIndex);
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    await submitExam();
  };

  const goPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  const toggleBookmark = (index: number) => {
    setBookmarkedIndexes((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const reset = () => {
    setCurrentIndex(0);
    setDraftAnswers({});
    setAnswers({});
    setCheckedAnswers({});
    setBookmarkedIndexes(new Set());
    setIsSubmitting(false);
    setSubmitError(null);
    setResult(null);
    hasAutoSubmittedRef.current = false;
    attemptStartedAtMsRef.current = Date.now();
    setTimerTick(0);
  };

  return {
    currentIndex,
    currentQuestion,
    currentAnswer,
    answers,
    checkedAnswers,
    bookmarkedIndexes,
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
    toggleBookmark,
    timerDisplay,
    timerIsLow,
    reset,
  };
}
