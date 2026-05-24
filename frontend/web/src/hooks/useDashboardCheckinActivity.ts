'use client';

import { useEffect, useMemo, useState } from 'react';
import { DAILY_ACTIVITY, STREAK_DAYS } from '@/constants/dashboard';
import type { AuthStatus } from '@/types/auth';
import type { DashboardActivityWeek } from '@/types/dashboard';
import { fetchCheckinActivity } from '@/services/auth/checkinApi';

interface UseDashboardCheckinActivityOptions {
  status: AuthStatus;
  accessToken?: string | null;
}

interface UseDashboardCheckinActivityResult {
  activityWeeks: DashboardActivityWeek[];
  streakDays: number;
  isLoadingActivity: boolean;
}

const FALLBACK_ACTIVITY_WEEKS: DashboardActivityWeek[] = DAILY_ACTIVITY;
const FALLBACK_STREAK_DAYS = STREAK_DAYS;

export function useDashboardCheckinActivity({
  status,
  accessToken,
}: UseDashboardCheckinActivityOptions): UseDashboardCheckinActivityResult {
  const [activityWeeks, setActivityWeeks] = useState<DashboardActivityWeek[]>(FALLBACK_ACTIVITY_WEEKS);
  const [streakDays, setStreakDays] = useState<number>(FALLBACK_STREAK_DAYS);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !accessToken) {
      setActivityWeeks(FALLBACK_ACTIVITY_WEEKS);
      setStreakDays(FALLBACK_STREAK_DAYS);
      setIsLoadingActivity(false);
      return;
    }

    const controller = new AbortController();
    setIsLoadingActivity(true);

    void fetchCheckinActivity({
      accessToken,
      signal: controller.signal,
      weekCount: 3,
    })
      .then((result) => {
        if (controller.signal.aborted || !result) {
          return;
        }

        setActivityWeeks(result.activityWeeks);
        setStreakDays(result.streakDays);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingActivity(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [accessToken, status]);

  return useMemo(() => ({
    activityWeeks,
    streakDays,
    isLoadingActivity,
  }), [activityWeeks, streakDays, isLoadingActivity]);
}
