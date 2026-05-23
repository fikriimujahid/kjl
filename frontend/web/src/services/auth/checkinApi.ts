import { AUTH_ENDPOINTS } from '@/constants/auth';
import { extractSuccessData } from '@/lib/api/response';
import type { DashboardActivityWeek } from '@/types/dashboard';

interface BaseAuthCheckinRequestOptions {
  signal?: AbortSignal;
  cache?: RequestCache;
  accessToken?: string;
}

interface SaveSessionCheckinOptions extends BaseAuthCheckinRequestOptions {
  productId: string;
  topicId: string;
  sessionId: string;
}

interface FetchCheckinActivityOptions extends BaseAuthCheckinRequestOptions {
  weekCount?: number;
}

export interface SaveSessionCheckinResponse {
  userId: string;
  productId: string;
  topicId: string;
  sessionId: string;
  activityDate: string;
  checkInAt: string;
}

export interface CheckinActivityResponse {
  streakDays: number;
  totalActiveDays: number;
  totalDays: number;
  activityWeeks: DashboardActivityWeek[];
}

function isActivityWeek(value: unknown): value is DashboardActivityWeek {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.label === 'string'
    && Array.isArray(candidate.values)
    && candidate.values.every((item) => typeof item === 'number');
}

function isCheckinActivityResponse(value: unknown): value is CheckinActivityResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.streakDays === 'number'
    && typeof candidate.totalActiveDays === 'number'
    && typeof candidate.totalDays === 'number'
    && Array.isArray(candidate.activityWeeks)
    && candidate.activityWeeks.every(isActivityWeek);
}

function isSaveSessionCheckinResponse(value: unknown): value is SaveSessionCheckinResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.userId === 'string'
    && typeof candidate.productId === 'string'
    && typeof candidate.topicId === 'string'
    && typeof candidate.sessionId === 'string'
    && typeof candidate.activityDate === 'string'
    && typeof candidate.checkInAt === 'string';
}

export async function saveSessionCheckin({
  productId,
  topicId,
  sessionId,
  signal,
  cache = 'no-store',
  accessToken,
}: SaveSessionCheckinOptions): Promise<SaveSessionCheckinResponse | null> {
  try {
    const headers: HeadersInit = {
      'content-type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    };

    const response = await fetch(AUTH_ENDPOINTS.checkin, {
      method: 'POST',
      signal,
      cache,
      headers,
      body: JSON.stringify({
        productId,
        topicId,
        sessionId,
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    const data = extractSuccessData<unknown>(payload);

    if (!isSaveSessionCheckinResponse(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

export async function fetchCheckinActivity({
  weekCount = 3,
  signal,
  cache = 'no-store',
  accessToken,
}: FetchCheckinActivityOptions = {}): Promise<CheckinActivityResponse | null> {
  try {
    const query = new URLSearchParams({ weekCount: String(weekCount) });
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(`${AUTH_ENDPOINTS.checkin}?${query.toString()}`, {
      method: 'GET',
      signal,
      cache,
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    const data = extractSuccessData<unknown>(payload);

    if (!isCheckinActivityResponse(data)) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
