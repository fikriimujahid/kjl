import { MIN_REFRESH_DELAY_MS, REFRESH_LEAD_TIME_MS } from '@/constants/auth';
import { parseJwtPayload } from './token';

export function clearAuthRefreshTimer(timerId: number | null): null {
  if (timerId !== null && typeof window !== 'undefined') {
    window.clearTimeout(timerId);
  }

  return null;
}

export function scheduleAuthRefresh(accessToken: string | null | undefined, onRefresh: () => void): number | null {
  if (!accessToken || typeof window === 'undefined') {
    return null;
  }

  const payload = parseJwtPayload(accessToken);
  if (!payload?.exp) {
    return null;
  }

  const delayMs = Math.max(payload.exp * 1000 - Date.now() - REFRESH_LEAD_TIME_MS, MIN_REFRESH_DELAY_MS);
  return window.setTimeout(onRefresh, delayMs);
}