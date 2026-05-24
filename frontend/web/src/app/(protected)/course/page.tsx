'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/auth/RequireAuth';
import CourseDetailPage from './CourseDetailPage';

function CourseContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId')?.trim();
  const topicId = searchParams.get('topicId')?.trim();
  const sessionId = searchParams.get('sessionId')?.trim();

  if (productId) {
    return (
      <CourseDetailPage
        productId={productId}
        topicId={topicId}
        sessionId={sessionId}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-3">Pilih Produk Belajar</h1>
        <p className="text-sm text-slate-500 font-medium">Buka halaman produk dan pilih paket yang sudah kamu miliki untuk memulai sesi belajar.</p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="p-4" />}>
        <CourseContent />
      </Suspense>
    </RequireAuth>
  );
}
