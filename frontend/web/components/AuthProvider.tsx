'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  clearStoredAuthSession,
  readStoredAuthSession,
  StoredAuthSession,
  writeStoredAuthSession,
  AuthUser,
} from '@/lib/auth';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  idToken: string | null;
  refreshToken: string | null;
  login: (session: StoredAuthSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<StoredAuthSession | null>(null);

  useEffect(() => {
    const storedSession = readStoredAuthSession();
    if (storedSession) {
      setSession(storedSession);
      setStatus('authenticated');
      return;
    }

    clearStoredAuthSession();
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      status,
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      idToken: session?.idToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      login: (nextSession: StoredAuthSession) => {
        writeStoredAuthSession(nextSession);
        setSession(nextSession);
        setStatus('authenticated');
      },
      logout: () => {
        clearStoredAuthSession();
        setSession(null);
        setStatus('unauthenticated');
      },
    };
  }, [session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
