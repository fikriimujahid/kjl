'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductDetailPage } from './ProductDetailPage';
import ProductsPage from './ProductsPage';

function ProductsPageContent() {
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId')?.trim();

  if (productId) {
    return <ProductDetailPage productId={productId} />;
  }

  return <ProductsPage />;
}

export function Page() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" />}>
      <ProductsPageContent />
    </Suspense>
  );
}

export default Page;