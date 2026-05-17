'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Play, Book, Music, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, Session, SessionDetail } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import QuizViewer from '@/shared/components/QuizViewer';
import ImageViewer from '@/shared/components/ImageViewer';
import { cn } from '@/shared/utils';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { fetchProductSessionDetails, getOwnedProducts } from '@/infrastructure/api-clients/products.client';

export default function MyLearningPage() {
  const { status, user, accessToken } = useAuth();
  const [ownedProducts, setOwnedProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [activeImagePages, setActiveImagePages] = useState<string[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
  const [isLoadingOwnedProducts, setIsLoadingOwnedProducts] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !user?.id) {
      setOwnedProducts([]);
      setSelectedProduct(null);
      setIsLoadingOwnedProducts(false);
      return;
    }

    const userId = user.id;

    const controller = new AbortController();
    let isActive = true;

    async function loadPageOwnedProducts() {
      const nextOwnedProducts = await getOwnedProducts({
        signal: controller.signal,
        userId,
        accessToken: accessToken ?? undefined,
      });

      if (!isActive) {
        return;
      }

      // setOwnedProducts(nextOwnedProducts);
      // setSelectedProduct((current) => {
      //   if (current && nextOwnedProducts.some((product) => product.id === current.id)) {
      //     return current;
      //   }

      //   return nextOwnedProducts[0] ?? null;
      // });
      setIsLoadingOwnedProducts(false);
    }

    loadPageOwnedProducts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [status, user?.id, accessToken]);

  if (isLoadingOwnedProducts) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Memuat Produk Kamu</h1>
          <p className="text-slate-500 mb-8 font-medium">Sedang mengambil daftar produk yang sudah kamu beli.</p>
        </div>
      </RequireAuth>
    );
  }

  if (ownedProducts.length === 0) {
    return (
      <RequireAuth>
        <div className="max-w-7xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-slate-800 mb-4 tracking-tight">Kamu Belum Punya Produk</h1>
          <p className="text-slate-500 mb-8 font-medium">Silakan beli produk pembelajaran pertama kamu untuk memulai.</p>
          <Link href="/products" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-sm">
            Cari Produk
          </Link>
        </div>
      </RequireAuth>
    );
  }

  const getIcon = (type: string) => {
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

  const fetchSessionById = async (
    productId: string,
    topicId: string,
    session: Session,
  ): Promise<SessionDetail[]> => {
    const sessionDetails = await fetchProductSessionDetails({
      productId,
      topicId,
      sessionId: session.id,
      accessToken: accessToken ?? undefined,
    });

    return sessionDetails ?? [];
  };

  const normalizeContentUrl = (url?: string) => {
    if (!url) {
      return '';
    }

    return url.startsWith('/public/') ? url.replace('/public/', '/') : url;
  };

  const handleSessionClick = async (topicId: string, session: Session) => {
    if (loadingSessionId === session.id) {
      return;
    }

    if (!selectedProduct) {
      return;
    }

    setLoadingSessionId(session.id);

    try {
      const sessionDetails = await fetchSessionById(selectedProduct.id, topicId, session);

      if (session.type === 'quiz') {
        setActiveImagePages([]);
        setActiveSession({
          ...session,
          topicId,
          questions: sessionDetails.map((detail) => ({
            id: detail.id,
            text: detail.text ?? '',
            image: detail.image,
            audio: detail.audio,
            options: detail.options ?? [],
            optionIds:
              detail.optionIds ??
              (detail.options ?? []).map((_, index) => `opt${String.fromCharCode(65 + index)}`),
            correctAnswer: '',
          })),
        });
      } else if (session.type === 'images') {
        const imagePages = sessionDetails
          .map((detail) => normalizeContentUrl(detail.contentUrl))
          .filter((url) => url.length > 0);

        setActiveImagePages(imagePages);
        setActiveSession({
          ...session,
          topicId,
          contentUrl: imagePages[0],
        });
      } else {
        setActiveImagePages([]);
        setActiveSession({
          ...session,
          topicId,
          contentUrl: normalizeContentUrl(sessionDetails[0]?.contentUrl ?? session.contentUrl),
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to load session data', error);
    } finally {
      setLoadingSessionId(null);
    }
  };

  return (
    <RequireAuth>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-8 order-2 lg:order-1 overflow-visible">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 overflow-x-auto whitespace-nowrap lg:whitespace-normal no-scrollbar">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 px-2 hidden lg:block">Produk Saya</h3>
            <div className="flex lg:flex-col gap-2">
              {ownedProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setActiveSession(null);
                    setActiveImagePages([]);
                    setExpandedTopic(null);
                  }}
                  className={cn(
                    'px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all text-left min-w-[200px] lg:min-w-0 text-sm',
                    selectedProduct?.id === product.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-white text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <div className={cn('w-2 h-6 rounded-full shrink-0', selectedProduct?.id === product.id ? 'bg-white' : 'bg-indigo-100')} />
                  <span className="line-clamp-1">{product.name}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedProduct && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 tracking-tight text-sm">Kurikulum Belajar</h3>
                {/* <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">{selectedProduct.topics.length} Topik Tersedia</p> */}
              </div>
              {/* <div className="divide-y divide-slate-50">
                {selectedProduct.topics.map((topic) => (
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
              </div> */}
            </div>
          )}
        </div>

        <div className="lg:col-span-8 order-1 lg:order-2">
          {activeSession ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">{activeSession.title}</h2>
                </div>
                <button
                  onClick={() => {
                    setActiveSession(null);
                    setActiveImagePages([]);
                  }}
                  className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Tutup Materi
                </button>
              </div> */}

              <div className="min-h-[400px]">
                
                {activeSession.type === 'quiz' && activeSession.questions && (
                  <QuizViewer
                    questions={activeSession.questions}
                    productId={selectedProduct?.id ?? ''}
                    topicId={activeSession.topicId ?? ''}
                    sessionId={activeSession.id}
                    accessToken={accessToken ?? undefined}
                  />
                )}

                {activeSession.type === 'images' && <ImageViewer title={activeSession.title} images={activeImagePages} />}

                {activeSession.type === 'pdf' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center border border-red-100">
                        <FileText size={16} />
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{activeSession.title}</span>
                    </div>
                    <iframe
                      src={`https://docs.google.com/viewer?embedded=true&url=${encodeURIComponent(activeSession.contentUrl ?? '')}`}
                      title={activeSession.title}
                      className="flex-1 w-full min-h-[540px]"
                    />
                  </div>
                )}

                {activeSession.type === 'audio' && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 flex flex-col items-center justify-center min-h-[500px] text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-8 border border-blue-100 shadow-inner">
                      <Music size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Sesi Audio Chokai</h3>
                    <p className="text-slate-500 max-w-sm mb-12 text-sm font-medium">Dengarkan audio dan ikuti instruksi yang ada pada lembar soal.</p>

                    <div className="w-full max-w-lg bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-inner">
                      <audio controls className="w-full">
                        <source src={activeSession.contentUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
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