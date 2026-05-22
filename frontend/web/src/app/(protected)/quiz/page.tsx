'use client';

import { Suspense } from 'react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import QuizPage from './QuizPage';

export default function Page() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="p-4" />}>
        <QuizPage />
      </Suspense>
    </RequireAuth>
  );
}
