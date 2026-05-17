'use client';

import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Product, Session } from '@/types';
import { fetchPurchasedProductDetails } from '@/infrastructure/api-clients/products.client';
import { Play, Book, Music, FileText } from 'lucide-react';
import { useEffect, useState } from 'react';

interface CourseDetailPageProps {
  productId: string;
}

export function CourseDetailPage({ productId }: CourseDetailPageProps) {
  const { status, user, accessToken } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const authenticatedUserId = user?.id;

    if (status !== 'authenticated' || !authenticatedUserId || !productId) {
      setSelectedProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    const userId = authenticatedUserId;
    const controller = new AbortController();
    let isActive = true;

    async function loadPurchasedProduct() {
      setIsLoadingProduct(true);
      setProductError(null);

      try {
        const product = await fetchPurchasedProductDetails({
          userId,
          productId,
          signal: controller.signal,
          accessToken: accessToken ?? undefined,
        });

        if (!isActive) {
          return;
        }

        if (!product) {
          setSelectedProduct(null);
          setProductError('Produk tidak tersedia atau kamu belum memiliki akses.');
          return;
        }

        setSelectedProduct(product);
      } catch {
        if (isActive) {
          setSelectedProduct(null);
          setProductError('Gagal memuat detail produk yang dibeli.');
        }
      } finally {
        if (isActive) {
          setIsLoadingProduct(false);
        }
      }
    }

    loadPurchasedProduct();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [status, user?.id, accessToken, productId]);

  const getIcon = (type: Session['type']) => {
    switch (type) {
      case 'quiz':
        return <Play size={18} className="text-orange-500" />;
      case 'pdf':
        return <FileText size={18} className="text-red-500" />;
      case 'audio':
        return <Music size={18} className="text-blue-500" />;
      default:
        return <Book size={18} className="text-teal-500" />;
    }
  };

  const handleSessionClick = async (topicId: string, session: Session) => {
    if (loadingSessionId === session.id) {
      return;
    }

    setLoadingSessionId(session.id);

    try {
      setActiveSession({ ...session, topicId });
    } finally {
      setLoadingSessionId(null);
    }
  };

  return (
    <RequireAuth>
      <div className="mx-auto px-3 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1 overflow-visible">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 tracking-tight text-sm">Kurikulum Belajar {selectedProduct ? `${selectedProduct.name}` : ''}</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {isLoadingProduct && (
                  <div className="p-4 space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-10 bg-slate-100 rounded-xl" />
                    ))}
                  </div>
                )}

                {!isLoadingProduct && productError && (
                  <div className="p-5 text-xs font-semibold text-rose-500">{productError}</div>
                )}

                {!isLoadingProduct && !productError && !selectedProduct && (
                  <div className="p-5 text-xs font-semibold text-slate-500">Produk tidak ditemukan.</div>
                )}

                {!isLoadingProduct && !productError && selectedProduct && (
                  <div className="p-5 text-xs font-semibold text-slate-500">Kurikulum sesi akan dipublikasikan pada update berikutnya.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 order-1 lg:order-2">
            {activeSession ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="min-h-[400px]" />
              </div>
            ) : isLoadingProduct ? (
              <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-8 space-y-5">
                <div className="h-7 w-1/3 bg-slate-200 rounded-full" />
                <div className="h-4 w-full bg-slate-100 rounded-full" />
                <div className="h-4 w-5/6 bg-slate-100 rounded-full" />
                <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
                <div className="mt-6 h-56 w-full bg-slate-100 rounded-2xl" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
                <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-300">
                  {getIcon('quiz')}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Siap Mulai Belajar?</h2>
                <p className="text-slate-400 max-w-sm font-medium text-sm leading-relaxed">Pilih sebuah sesi dari kurikulum di sebelah kiri untuk menampilkan materi, kuis, atau audio pembelajaran.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
