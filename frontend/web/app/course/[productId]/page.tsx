import CourseDetailClient from './CourseDetailClient';

export const dynamicParams = true;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;

  return <CourseDetailClient productId={productId} />;
}