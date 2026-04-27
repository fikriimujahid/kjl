'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, Check, ShoppingCart, BookOpen, Clock, Globe,
  ChevronDown, FileText, Headphones, Image as ImageIcon, HelpCircle,
} from 'lucide-react';
import { MOCK_USER } from '@/lib/mock-data';
import { formatPrice } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Session } from '@/lib/types';

const PRODUCT_URL = process.env.NEXT_PUBLIC_PRODUCT_URL ?? '';

function sessionTypeLabel(type: Session['type']): string {
  switch (type) {
    case 'quiz':
      return 'Kuis';
    case 'pdf':
      return 'PDF';
    case 'audio':
      return 'Audio';
    case 'image':
      return 'Gambar';
    default:
      return type;
  }
}

function SessionTypeIcon({ type }: { type: Session['type'] }) {
  const props = { size: 14, className: 'shrink-0' };

  switch (type) {
    case 'quiz':
      return <HelpCircle {...props} />;
    case 'pdf':
      return <FileText {...props} />;
    case 'audio':
      return <Headphones {...props} />;
    case 'image':
      return <ImageIcon {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}

interface ProductDetailClientProps {
  productId: string;
}

export default function ProductDetailClient({ productId }: ProductDetailClientProps) {
  const router = useRouter();
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProduct() {
      try {
        const response = await fetch(PRODUCT_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        const products = Array.isArray(data)
          ? data
          : Array.isArray(data?.catalog)
            ? data.catalog
            : [];

        const matchedProduct = (products as Product[]).find((item) => item.id === productId) ?? null;
        setProduct(matchedProduct);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Failed to load product data for Product Detail page.', error);
        setProduct(null);
      }
    }

    fetchProduct();

    return () => {
      controller.abort();
    };
  }, [productId]);

  if (!product) {
    return null;
  }

  const isOwned = MOCK_USER.purchasedProductIds.includes(product.id);
  const totalSessions = product.topics.reduce((acc, topic) => acc + topic.sessions.length, 0);

  const handleBuy = () => {
    router.push('/payment-success');
  };

  const toggleTopic = (topicId: string) => {
    setOpenTopicId((current) => (current === topicId ? null : topicId));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:-translate-x-1 transition-transform">
        <ChevronLeft size={20} />
        Kembali ke Katalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-50 to-slate-100 rounded-[3rem] shadow-sm border border-indigo-100 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <BookOpen size={240} className="text-indigo-900" />
              </div>
              <div className="relative z-10 w-24 h-24 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center mb-8">
                <span className="text-3xl font-black text-indigo-600">{product.level}</span>
              </div>
              <h2 className="relative z-10 text-3xl font-bold text-slate-800 mb-2">{product.name}</h2>
              <p className="relative z-10 text-sm font-bold text-slate-500 uppercase tracking-widest">Platform Modul Eksperiensial</p>
            </div>
          </motion.div>

          {product.topics.length > 0 && (
            <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">Daftar Topik</h2>
                <span className="text-sm text-gray-400 font-bold">
                  {product.topics.length} topik · {totalSessions} sesi
                </span>
              </div>

              <div className="space-y-3">
                {product.topics.map((topic, index) => (
                  <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button onClick={() => toggleTopic(topic.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
                      <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{index + 1}</span>
                      <span className="flex-1 font-bold text-gray-800">{topic.title}</span>
                      <span className="text-xs text-gray-400 font-medium mr-2">{topic.sessions.length} sesi</span>
                      <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${openTopicId === topic.id ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence initial={false}>
                      {openTopicId === topic.id && (
                        <motion.div key="content" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                          <div className="border-t border-gray-100 px-5 py-3 space-y-1">
                            {topic.sessions.map((session) => (
                              <div key={session.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                                <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                  <SessionTypeIcon type={session.type} />
                                </div>
                                <span className="flex-1 text-sm text-gray-700 font-medium">{session.title}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{sessionTypeLabel(session.type)}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
          <div>
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              {product.level}
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">{product.name}</h1>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">{product.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <BookOpen className="text-indigo-500 mb-3" size={22} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Topik</p>
              <p className="text-xl font-black text-gray-900">{product.topicsCount}</p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <Clock className="text-orange-500 mb-3" size={22} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Akses</p>
              <p className="text-xl font-black text-gray-900">{product.accessDurationDays} Hari</p>
            </div>
            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <Globe className="text-teal-500 mb-3" size={22} />
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Format</p>
              <p className="text-xl font-black text-gray-900">Digital</p>
            </div>
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-indigo-600 font-black uppercase text-xs tracking-widest mb-1">HARGA PRODUK</p>
              <p className="text-4xl font-black text-indigo-900">{formatPrice(product.price)}</p>
            </div>
            {isOwned ? (
              <Link href="/my-learning" className="w-full md:w-auto px-10 py-5 bg-teal-600 text-white rounded-3xl font-black text-xl hover:bg-teal-700 shadow-xl shadow-teal-100 transition-all flex items-center justify-center gap-3">
                Sudah Dimiliki
                <Check size={28} />
              </Link>
            ) : (
              <button onClick={handleBuy} className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3">
                Beli Sekarang
                <ShoppingCart size={28} />
              </button>
            )}
          </div>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4">Yang akan kamu pelajari:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Ratusan kosakata & tata bahasa', 'Latihan soal interaktif', 'Simulasi ujian waktu nyata', 'PDF materi eksklusif'].map((feature, index) => (
                <div key={index} className="flex gap-3 items-center p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                  <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                    <Check size={16} strokeWidth={3} />
                  </div>
                  <span className="font-bold text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
