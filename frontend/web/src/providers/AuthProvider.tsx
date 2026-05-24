'use client';

import React, { createContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  executeAuthRefresh,
} from '@/services/auth/refresh';
import { initializeAuthSession } from '@/services/auth/session';
import { clearAuthRefreshTimer, scheduleAuthRefresh } from '@/services/auth/refreshScheduler';
import { logoutAuthSession } from '@/services/auth/logoutApi';
import type { AuthContextValue, AuthStatus, StoredAuthSession } from '@/types/auth';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<StoredAuthSession | null>(null);
  const refreshTimer = useRef<number | null>(null);

  const clearRefreshTimer = () => {
    refreshTimer.current = clearAuthRefreshTimer(refreshTimer.current);
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

  const refresh = () => executeAuthRefresh({
    onAuthenticated: applyAuthenticatedSession,
    onUnauthenticated: clearSession,
  });

  useEffect(() => {
    let isActive = true;

    void initializeAuthSession({
      isActive: () => isActive,
      onAuthenticated: applyAuthenticatedSession,
      onUnauthenticated: clearSession,
    });

    return () => {
      isActive = false;
      clearRefreshTimer();
    };
  }, []);

  useEffect(() => {
    clearRefreshTimer();

    if (status !== 'authenticated') {
      return;
    }

    refreshTimer.current = scheduleAuthRefresh(session?.accessToken, () => {
      void refresh();
    });

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