'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchLearningSessionQuestions } from '@/services/learning/learningApi';
import type { Question } from '@/types/product';
import type { QuizMode } from '@/types/quiz';

interface UseQuizPageDataResult {
  productId: string;
  topicId: string;
  sessionId: string;
  attemptId?: string;
  mode: QuizMode;
  backHref: string;
  questions: Question[];
  isLoading: boolean;
  error: string | null;
  durationMinutes: number | undefined;
}

export function useQuizPageData(accessToken?: string): UseQuizPageDataResult {
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId')?.trim() ?? '';
  const topicId = searchParams.get('topicId')?.trim() ?? '';
  const sessionId = searchParams.get('sessionId')?.trim() ?? '';
  const rawMode = searchParams.get('mode');
  const attemptId = searchParams.get('attemptId')?.trim() || undefined;
  const rawDuration = searchParams.get('duration');
  const durationMinutes = rawDuration != null && rawDuration !== '' ? (Number(rawDuration) || undefined) : undefined;

  const mode: QuizMode = rawMode === 'exam' ? 'exam' : 'practice';
  const backHref = productId ? `/course?productId=${productId}` : '/course';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId || !topicId || !sessionId) {
      setQuestions([]);
      setError('Parameter halaman tidak lengkap.');
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void fetchLearningSessionQuestions({
      productId,
      topicId,
      sessionId,
      accessToken,
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setQuestions(response);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setQuestions([]);
          setError('Gagal memuat soal. Silakan coba lagi.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [productId, topicId, sessionId, accessToken]);

  return useMemo(() => ({
    productId,
    topicId,
    sessionId,
    attemptId,
    mode,
    backHref,
    questions,
    isLoading,
    error,
    durationMinutes,
  }), [productId, topicId, sessionId, attemptId, mode, backHref, questions, isLoading, error, durationMinutes]);
}
