'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import CourseDetailPage from './CourseDetailPage';

function CourseContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId')?.trim();

  if (productId) {
    return <CourseDetailPage productId={productId} />;
  }

  return (
    <RequireAuth>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Course Page</h1>
        <p>Welcome to the course page! Here you can find all your courses and materials.</p>
      </div>
    </RequireAuth>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4" />}>
      <CourseContent />
    </Suspense>
  );
}
