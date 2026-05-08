'use client';

import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { Product, Session } from '@/lib/types';
import { cn } from '@/lib/utils';
import { fetchPurchasedProductDetails } from '@/lib/products';
import { ChevronDown, ChevronUp, Play, Book, Music, FileText } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import QuizViewer from '@/components/QuizViewer';
import ImageViewer from '@/components/ImageViewer';

interface CourseDetailClientProps {
  productId: string;
}

export default function CourseDetailClient({ productId }: CourseDetailClientProps) {
  const { status, user, accessToken } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    const authenticatedUserId = user?.id;

    if (status !== 'authenticated') {
      setSelectedProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    if (!authenticatedUserId) {
      setSelectedProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    if (!productId) {
      setSelectedProduct(null);
      setIsLoadingProduct(false);
      return;
    }

    const userIdForRequest: string = authenticatedUserId;
    const selectedProductId: string = productId;

    const controller = new AbortController();
    let isActive = true;

    async function loadPurchasedProduct() {
      setIsLoadingProduct(true);
      setProductError(null);

      try {
        const product = await fetchPurchasedProductDetails({
          userId: userIdForRequest,
          productId: selectedProductId,
          signal: controller.signal,
          accessToken: accessToken ?? undefined,
        });

        // In local dev, React Strict Mode can abort an initial request.
        // Ignore any result from an inactive effect run.
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
                {/* <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {selectedProduct ? `${selectedProduct.topics.length} Topik Tersedia` : 'Topik Tersedia'}
                </p> */}
              </div>
              <div className="divide-y divide-slate-50">
                {isLoadingProduct && (
                  <div className="p-5 text-xs font-semibold text-slate-500">Memuat kurikulum produk...</div>
                )}

                {!isLoadingProduct && productError && (
                  <div className="p-5 text-xs font-semibold text-rose-500">{productError}</div>
                )}

                {!isLoadingProduct && !productError && !selectedProduct && (
                  <div className="p-5 text-xs font-semibold text-slate-500">Produk tidak ditemukan.</div>
                )}

                {!isLoadingProduct && !productError && selectedProduct?.topics.map((topic) => (
                  <div key={topic.id} className="overflow-hidden">
                    <button
                      onClick={() => setExpandedTopic(expandedTopic === topic.id ? null : topic.id)}
                      className="w-full p-5 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="font-bold text-slate-800 text-xs leading-tight pr-4">{topic.title}</span>
                      {expandedTopic === topic.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </button>
                    <AnimatePresence>
                      {expandedTopic === topic.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                          <div className="px-3 pb-4 space-y-1">
                            {topic.sessions.map((session) => (
                              <button
                                key={session.id}
                                onClick={() => handleSessionClick(topic.id, session)}
                                disabled={loadingSessionId !== null}
                                className={cn(
                                  'w-full p-3 rounded-lg flex items-center gap-4 transition-all text-left disabled:opacity-70 disabled:cursor-wait',
                                  activeSession?.id === session.id
                                    ? 'bg-white shadow-sm ring-1 ring-slate-100 text-indigo-600'
                                    : 'text-slate-600 hover:bg-white/50',
                                )}
                              >
                                <div className={cn(
                                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100',
                                  activeSession?.id === session.id ? 'bg-indigo-50' : 'bg-white',
                                )}>
                                  {getIcon(session.type)}
                                </div>
                                <span className="font-bold text-xs leading-tight">
                                  {loadingSessionId === session.id ? 'Memuat sesi...' : session.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9 order-1 lg:order-2">
            {activeSession ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"> 
                <div className="min-h-[400px]">
                  {/* {activeSession.type === 'images' && <ImageViewer title={activeSession.title} images={activeImagePages} />} */}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-300">
                  <Play size={48} />
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