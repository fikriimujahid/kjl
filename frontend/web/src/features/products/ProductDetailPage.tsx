'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import {
  AlreadyOwnedModal,
  PaymentErrorModal,
  ProductDetailHeroCard,
  ProductDetailNotFound,
  ProductDetailSkeleton,
  ProductOverviewPanel,
  ProductTopicsSection,
} from './components';
import { useProductDetails } from './hooks/useProductDetail';
import { usePurchaseProduct } from './hooks/useProductPurchase';
import { getTotalSessions } from './utils/product.utils';

interface ProductDetailPageProps {
  productId: string;
}

export function ProductDetailPage({ productId }: ProductDetailPageProps) {
  const { productDetails, isLoading } = useProductDetails(productId);
  const { isBuying, paymentModal, purchaseProduct, clearPaymentModal } = usePurchaseProduct();
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

  const handleBackClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.assign('/products');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Link
        href="/products"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:-translate-x-1 transition-transform"
      >
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
          onBuy={handleBuy}
        />
      </div>

      {paymentModal?.type === 'error' && (
        <PaymentErrorModal message={paymentModal.message} onClose={clearPaymentModal} />
      )}
      {paymentModal?.type === 'already_owned' && (
        <AlreadyOwnedModal productId={paymentModal.productId} onClose={clearPaymentModal} />
      )}
    </div>
  );
}