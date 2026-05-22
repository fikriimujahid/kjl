'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Trophy, CheckCircle2, XCircle, Clock, Calendar, TrendingUp, Target } from 'lucide-react';
import {
  fetchLearningSessionAttempts,
  type LearningSessionAttempt,
} from '@/services/learning/learningApi';
import { cn } from '@/utils/classnames';
import { ASSESSMENT_HISTORY_CONFIG } from './assessmentConfig';
import type { AssessmentHistoryViewProps } from '../../../types/assessment';
import { formatAttemptDate, formatDurationSeconds } from '@/utils/formatters';

interface AssessmentAttemptViewModel {
  attemptId: string;
  attemptNumber: number;
  date: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTaken: string;
  passed: boolean;
  passingScore?: number;
  isActive: boolean;
  hasResult: boolean;
}

function mapAttemptToViewModel(attempt: LearningSessionAttempt): AssessmentAttemptViewModel {
  const hasResult = attempt.status === 'FINISHED' && typeof attempt.percentage === 'number';

  return {
    attemptId: attempt.attemptId,
    attemptNumber: attempt.attemptNumber,
    date: formatAttemptDate(attempt.startedAt),
    score: hasResult ? Math.round(attempt.percentage ?? 0) : 0,
    correctAnswers: attempt.correctAnswers ?? 0,
    totalQuestions: attempt.totalQuestions ?? 0,
    timeTaken: formatDurationSeconds(attempt.durationSeconds),
    passed: hasResult ? Boolean(attempt.passed) : false,
    passingScore: attempt.passingScore,
    isActive: attempt.isActive || attempt.status === 'ACTIVE',
    hasResult,
  };
}

export function AssessmentHistoryView({
  mode,
  sessionTitle,
  passingScore,
  productId,
  topicId,
  sessionId,
  accessToken,
  onStartOrResume,
}: AssessmentHistoryViewProps) {
  const config = ASSESSMENT_HISTORY_CONFIG[mode];

  const [attempts, setAttempts] = useState<LearningSessionAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      setAttempts([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);

    void fetchLearningSessionAttempts({
      productId,
      topicId,
      sessionId,
      accessToken,
      signal: controller.signal,
    })
      .then((response) => {
        if (!controller.signal.aborted) {
          setAttempts(response?.attempts ?? []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAttempts([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => { controller.abort(); };
  }, [productId, topicId, sessionId, accessToken]);

  const handleStartOrResume = () => {
    onStartOrResume();
  };

  const formattedAttempts = attempts.map(mapAttemptToViewModel);
  const finishedAttempts = formattedAttempts.filter((attempt) => attempt.hasResult);

  const bestAttempt = finishedAttempts.reduce<AssessmentAttemptViewModel | null>((best, current) => {
    if (!best || current.score > best.score) {
      return current;
    }

    return best;
  }, null);

  const avgScore = finishedAttempts.length > 0
    ? Math.round(finishedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / finishedAttempts.length)
    : 0;

  const passCount = finishedAttempts.filter((attempt) => attempt.passed).length;
  const hasActiveAttempt = formattedAttempts.some((attempt) => attempt.isActive);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={cn('bg-gradient-to-r px-8 py-6', config.headerGradientClass)}> 
          <p className={cn('text-xs font-semibold uppercase tracking-widest mb-1', config.badgeTextClass)}>
            {config.badgeLabel}
          </p>
          <h1 className="text-white text-2xl font-bold tracking-tight">{sessionTitle}</h1>
        </div>

        <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
          <div className="px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Trophy size={20} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Skor Terbaik</p>
              <p className="text-2xl font-bold text-slate-800">{bestAttempt ? `${bestAttempt.score}%` : '-'}</p>
            </div>
          </div>
          <div className="px-6 py-5 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', config.averageIconBgClass)}>
              <TrendingUp size={20} className={config.averageIconColorClass} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Rata-rata Skor</p>
              <p className="text-2xl font-bold text-slate-800">{avgScore}%</p>
            </div>
          </div>
          <div className="px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
              <CheckCircle2 size={20} className="text-teal-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">{config.passedLabel}</p>
              <p className="text-2xl font-bold text-slate-800">
                {passCount}
                <span className="text-base text-slate-400 font-semibold"> / {finishedAttempts.length}</span>
              </p>
            </div>
          </div>
          <div className="px-6 py-5 flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Target size={20} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Minimal Kelulusan</p>
              <p className="text-2xl font-bold text-slate-800">
                {passingScore != null ? `${passingScore}%` : '-'} Benar
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-5 flex items-center justify-between bg-slate-50/60">
          <p className="text-sm text-slate-500 font-medium">
            {formattedAttempts.length} percobaan tersimpan
            {hasActiveAttempt ? ` • ${config.activeSummaryText}` : ''}
          </p>
          <button
            onClick={handleStartOrResume}
            className={cn(
              'flex items-center gap-2 px-6 py-3 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.97]',
              config.startButtonClass,
            )}
          >
            <RotateCcw size={16} />
            {hasActiveAttempt ? config.startButtonActiveLabel : config.startButtonIdleLabel}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 text-base">Riwayat Percobaan</h2>
        </div>

        {isLoading ? (
          <div className="px-8 py-10 text-sm text-slate-500">{config.loadingText}</div>
        ) : formattedAttempts.length === 0 ? (
          <div className="px-8 py-10 text-sm text-slate-500">{config.emptyText}</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {formattedAttempts.map((attempt) => {
              const scoreBarWidth = `${attempt.score}%`;
              return (
                <div key={attempt.attemptId} className="px-8 py-5 hover:bg-slate-50/70 transition-colors group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-5 flex-1">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm',
                          attempt.passed ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-500',
                        )}
                      >
                        #{attempt.attemptNumber}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider',
                              attempt.isActive
                                ? 'bg-sky-100 text-sky-700'
                                : attempt.passed
                                  ? 'bg-teal-100 text-teal-700'
                                  : 'bg-red-100 text-red-600',
                            )}
                          >
                            {attempt.isActive ? <Clock size={10} /> : attempt.passed ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                            {attempt.isActive ? 'Sedang Berjalan' : attempt.passed ? 'Lulus' : 'Tidak Lulus'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Calendar size={11} />
                            {attempt.date}
                          </span>
                          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={11} />
                            {attempt.timeTaken}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                attempt.isActive ? 'bg-sky-400' : attempt.passed ? 'bg-teal-500' : 'bg-red-400',
                              )}
                              style={{ width: scoreBarWidth }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
                            Lulus: {attempt.passingScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={cn(
                          'text-3xl font-bold tabular-nums',
                          attempt.isActive ? 'text-sky-600' : attempt.passed ? 'text-teal-600' : 'text-red-500',
                        )}
                      >
                        {attempt.hasResult ? `${attempt.score}%` : 'Aktif'}
                      </p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">
                        {attempt.hasResult
                          ? `${attempt.correctAnswers}/${attempt.totalQuestions} benar`
                          : 'Tes belum diselesaikan'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
