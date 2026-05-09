'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductsCatalog } from '@/components/products/ProductsCatalog';
import ProductDetailClient from './ProductDetailClient';

function ProductsPageContent() {
  const searchParams = useSearchParams();

  const productId = searchParams.get('productId')?.trim();

  if (productId) {
    return <ProductDetailClient productId={productId} />;
  }

  return <ProductsCatalog />;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10" />}>
      <ProductsPageContent />
    </Suspense>
  );
}