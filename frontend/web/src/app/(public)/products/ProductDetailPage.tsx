'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronLeft, BookOpen } from 'lucide-react';
import AlreadyOwnedModal from '@/components/products/detail/AlreadyOwnedModal';
import ProductDetailSkeleton from '@/components/products/detail/ProductDetailSkeleton';
import ProductDetailNotFound from '@/components/products/detail/ProductDetailNotFound';
import { ProductTopicsSection } from '@/components/products/detail/ProductTopicsSection';
import { ProductOverviewPanel } from '@/components/products/detail/ProductOverviewPanel';
import { PaymentErrorModal } from '@/components/products/detail/PaymentErrorModal';
import { useProductDetails } from '@/hooks/useProductDetail';
import { usePurchaseProduct } from '@/hooks/useProductPurchase';

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

  const totalSessions = productDetails.topics.reduce((acc, topic) => acc + topic.sessions.length, 0);

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
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-50 to-slate-100 rounded-[3rem] shadow-sm border border-indigo-100 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen size={240} className="text-indigo-900" />
              </div>
              <div className="relative z-10 w-24 h-24 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center mb-8">
                <span className="text-3xl font-black text-indigo-600">{productDetails.level}</span>
              </div>
              <h2 className="relative z-10 text-3xl font-bold text-slate-800 mb-2">{productDetails.name}</h2>
              <p className="relative z-10 text-sm font-bold text-slate-500 uppercase tracking-widest">Platform Modul Eksperiensial</p>
            </div>
          </motion.div>
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