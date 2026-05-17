'use client';

import { useContext } from 'react';
import { AuthContext } from '@/features/auth/providers/AuthProvider';
import type { AuthContextValue } from '@/features/auth/types/auth.types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}