'use client';

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchAuthSession,
  refreshAuthSession,
} from '@/features/auth/services/refresh';
import { parseJwtPayload } from '@/features/auth/services/jwt';
import { logoutAuthSession } from '@/features/auth/services/api';
import type { StoredAuthSession } from '@/features/auth/services/types';
import { MIN_REFRESH_DELAY_MS, REFRESH_LEAD_TIME_MS } from '@/features/auth/constants/auth.constants';
import type { AuthContextValue, AuthStatus } from '@/features/auth/types/auth.types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimer.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const applyAuthenticatedSession = (nextSession: StoredAuthSession) => {
    setSession(nextSession);
    setStatus('authenticated');
  };

  const clearSession = () => {
    clearRefreshTimer();
    setSession(null);
    setStatus('unauthenticated');
  };

  const refresh = async (): Promise<boolean> => {
    try {
      const nextSession = await refreshAuthSession();
      applyAuthenticatedSession(nextSession);
      return true;
    } catch {
      clearSession();
      return false;
    }
  };

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      const nextSession = await fetchAuthSession();

      if (!isActive) {
        return;
      }

      if (!nextSession) {
        clearSession();
        return;
      }

      applyAuthenticatedSession(nextSession);
    };

    bootstrap();

    return () => {
      isActive = false;
      clearRefreshTimer();
    };
  }, []);

  useEffect(() => {
    clearRefreshTimer();

    if (status !== 'authenticated' || !session?.accessToken || typeof window === 'undefined') {
      return;
    }

    const payload = parseJwtPayload(session.accessToken);
    if (!payload?.exp) {
      return;
    }

    const delayMs = Math.max(payload.exp * 1000 - Date.now() - REFRESH_LEAD_TIME_MS, MIN_REFRESH_DELAY_MS);

    refreshTimer.current = window.setTimeout(() => {
      void refresh();
    }, delayMs);

    return () => {
      clearRefreshTimer();
    };
  }, [session?.accessToken, status]);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      idToken: session?.idToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      login: (nextSession: StoredAuthSession) => {
        applyAuthenticatedSession(nextSession);
      },
      refresh,
      logout: async () => {
        try {
          await logoutAuthSession();
        } catch {
          // Always clear local auth state after logout intent.
        } finally {
          clearSession();
        }
      },
    };
  }, [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}