import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { Product } from '@/lib/types';
import CourseDetailClient from './CourseDetailClient';

async function loadStaticProductIds() {
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'public-data', 'product.json');
    const fallbackRaw = await readFile(fallbackPath, 'utf-8');
    const fallbackData: Product[] = JSON.parse(fallbackRaw);
    return fallbackData.map((product) => product.id);
  } catch {
    return [];
  }
}

export async function generateStaticParams() {
  const productIds = await loadStaticProductIds();

  return productIds.map((productId) => ({
    productId,
  }));
}

export const dynamicParams = false;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const staticProductIds = await loadStaticProductIds();

  if (!staticProductIds.includes(productId)) {
    notFound();
  }

  return <CourseDetailClient productId={productId} />;
}