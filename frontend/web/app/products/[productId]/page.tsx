import { notFound } from 'next/navigation';
import { MOCK_PRODUCTS_PUBLIC } from '@/lib/mock-data';
import ProductDetailClient from './ProductDetailClient';

export function generateStaticParams() {
  return MOCK_PRODUCTS_PUBLIC.map((product) => ({
    productId: product.id,
  }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = MOCK_PRODUCTS_PUBLIC.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient productId={productId} />;
}