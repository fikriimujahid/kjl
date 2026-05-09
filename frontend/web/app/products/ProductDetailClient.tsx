'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { ProductDetailHeroCard } from '@/components/products/detail/ProductDetailHeroCard';
import { ProductOverviewPanel } from '@/components/products/detail/ProductOverviewPanel';
import { ProductTopicsSection } from '@/components/products/detail/ProductTopicsSection';
import { useProductDetails } from '@/hooks/useProductDetails';
import { usePurchaseProduct } from '@/hooks/usePurchaseProduct';
import { getTotalSessions } from '@/lib/utils/product';
import ProductDetailSkeleton from '@/components/products/detail/ProductDetailSkeleton';
import ProductDetailNotFound from '@/components/products/detail/ProductDetailNotFound';

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const { productDetails, isLoading } = useProductDetails(productId);
  const { isBuying, paymentError, purchaseProduct } = usePurchaseProduct();
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  if (!productDetails) {
    return <ProductDetailNotFound />;
  }

  const totalSessions = getTotalSessions(productDetails.topics);

  const toggleTopic = (topicId: string) => {
    setOpenTopicId((current) => (current === topicId ? null : topicId));
  };

  const handleBuy = async () => {
    await purchaseProduct({
      productId: productDetails.id,
      loginNextPath: `/products?productId=${encodeURIComponent(productId)}`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:-translate-x-1 transition-transform">
        <ChevronLeft size={20} />
        Kembali ke Produk
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <ProductDetailHeroCard level={productDetails.level} name={productDetails.name} />
          <ProductTopicsSection
            topics={productDetails.topics}
            totalSessions={totalSessions}
            openTopicId={openTopicId}
            onToggleTopic={toggleTopic}
          />
        </div>

        <ProductOverviewPanel
          productDetails={productDetails}
          isBuying={isBuying}
          paymentError={paymentError}
          onBuy={handleBuy}
        />
      </div>
    </div>
  );
}
