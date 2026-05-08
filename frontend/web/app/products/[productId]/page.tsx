import ProductDetailClient from './ProductDetailClient';

export const dynamicParams = true;

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <ProductDetailClient productId={productId} />;
}