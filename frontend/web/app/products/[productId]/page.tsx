import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';
import { fetchProducts, PRODUCT_URL } from '@/lib/products';

export async function generateStaticParams() {
  if (!PRODUCT_URL || PRODUCT_URL.startsWith('/')) {
    return [];
  }

  const products = await fetchProducts({ cache: 'force-cache' });

  return products.map((product) => ({
    productId: product.id,
  }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  // For static export and SSR, validate on server only when PRODUCT_URL is absolute.
  if (PRODUCT_URL && !PRODUCT_URL.startsWith('/')) {
    const products = await fetchProducts({ cache: 'force-cache' });
    const product = products.find((item) => item.id === productId);

    if (!product) {
      notFound();
    }
  }

  return <ProductDetailClient productId={productId} />;
}