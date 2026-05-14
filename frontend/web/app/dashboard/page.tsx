'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlayCircle, Flame, Target, Mail, Calendar, BarChart3,
  TrendingUp, CheckCircle2, BookOpen, Trophy, Zap, ChevronRight,
  ArrowRight, Volume2, Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { Product } from '@/lib/types';
import { loadOwnedProducts } from '@/lib/products';

const STREAK_DAYS = 7;
const WORD_OF_THE_DAY = {
  word: '頑張る',
  reading: 'がんばる · ganbaru',
  meaning: 'Berusaha keras; pantang menyerah',
  example: '毎日頑張っています。',
  exampleTl: 'Saya berusaha keras setiap hari.',
};
const EXAM_DATE = new Date('2026-05-15');
const PRODUCT_PROGRESS: Record<string, number> = { p1: 42, p3: 17 };
// Each sub-array = one week [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
// Values: 0 = tidak belajar, >0 = belajar (dari kursus atau kuis)
const DAILY_ACTIVITY = [
  [100, 0, 100, 100, 0, 100, 100],   // 3 minggu lalu
  [100, 100, 0, 100, 100, 100, 0],   // 2 minggu lalu
  [100, 100, 100, 100, 0, 0, 0],   // minggu ini
];
const WEEK_LABELS = ['3 Minggu Lalu', '2 Minggu Lalu', 'Minggu Ini'];
const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const RECENT_ACHIEVEMENTS = [
  { label: '7-Hari Streak', icon: '🔥' },
  { label: 'Quiz Pertama', icon: '🎯' },
  { label: 'Topik Selesai', icon: '📚' },
];

function daysUntil(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / 86_400_000));
}

export default function DashboardPage() {
  const { status, user, accessToken } = useAuth();
  const [ownedProducts, setOwnedProducts] = useState<Product[]>([]);
  const [isLoadingOwnedProducts, setIsLoadingOwnedProducts] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !user?.id) {
      setOwnedProducts([]);
      setIsLoadingOwnedProducts(false);
      return;
    }

    const authenticatedUserId = user.id;

    const controller = new AbortController();
    let isActive = true;

    async function loadDashboardOwnedProducts() {
      const nextOwnedProducts = await loadOwnedProducts({
        signal: controller.signal,
        userId: authenticatedUserId,
        accessToken: accessToken ?? undefined,
      });

      if (!isActive) {
        return;
      }

      setOwnedProducts(nextOwnedProducts);
      setIsLoadingOwnedProducts(false);
    }

    loadDashboardOwnedProducts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [status, user?.id, accessToken]);

  const recentProduct = ownedProducts[0];
  const daysLeft = daysUntil(EXAM_DATE);
  const today = new Date().getDay();

  return (
    <RequireAuth>
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-4rem-2.5rem)] bg-slate-50 overflow-hidden">
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-6">
          <motion.header
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-72 h-72 bg-indigo-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                Selamat datang kembali, <span className="text-indigo-600">{user?.name ?? 'Pengguna'}</span>!
              </h1>
            </div>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-96 h-96 bg-indigo-50 rounded-full blur-[120px] translate-y-1/3 translate-x-1/4 pointer-events-none" />
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2.5">
                    <BarChart3 size={16} className="text-indigo-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aktivitas Belajar Harian</p>
                      <p className="text-xs text-slate-400 font-medium mt-0.5">3 minggu terakhir · dari kursus &amp; kuis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-indigo-500" /><span>Hari ini</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" /><span>Belajar</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200" /><span>Libur</span></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  {DAILY_ACTIVITY.map((weekData, weekIndex) => (
                    <div key={weekIndex}>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{WEEK_LABELS[weekIndex]}</p>
                      <div className="flex items-end justify-between gap-0.5 sm:gap-1" style={{ height: '52px' }}>
                        {weekData.map((pct, dayIndex) => {
                          const isToday = weekIndex === 2 && dayIndex === today;
                          const isFuture = weekIndex === 2 && dayIndex > today;
                          return (
                            <div key={dayIndex} className="flex flex-col items-center gap-1 flex-1">
                              <div className="w-full rounded-t-md overflow-hidden bg-slate-100" style={{ height: '40px' }}>
                                {!isFuture && pct > 0 && (
                                  <div
                                    className={cn(
                                      'w-full rounded-t-md transition-all',
                                      isToday ? 'bg-indigo-500' : pct === 100 ? 'bg-emerald-400' : 'bg-indigo-200',
                                    )}
                                    style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                                  />
                                )}
                              </div>
                              <span className={cn('text-[8px] sm:text-[9px] font-bold', isToday ? 'text-indigo-600' : isFuture ? 'text-slate-200' : 'text-slate-400')}>
                                {DAYS_SHORT[dayIndex]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-2xl font-black text-slate-900">14</p>
                    <p className="text-xs text-slate-500 mt-0.5">hari belajar <span className="text-slate-300">/ 21 hari</span></p>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-indigo-600">{STREAK_DAYS}</p>
                    <p className="text-xs text-slate-500 mt-0.5">hari streak sekarang 🔥</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-1.5">
                    <TrendingUp size={14} className="text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-500">Konsisten belajar lewat kursus &amp; kuis — terus pertahankan!</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kata Hari Ini</p>
                </div>
                <button className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
                  <Volume2 size={14} />
                </button>
              </div>
              <p className="text-4xl font-bold text-slate-900 mb-1">{WORD_OF_THE_DAY.word}</p>
              <p className="text-xs text-indigo-500 font-medium mb-3">{WORD_OF_THE_DAY.reading}</p>
              <p className="text-sm font-semibold text-slate-700 mb-3">{WORD_OF_THE_DAY.meaning}</p>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-sm text-slate-700 font-medium">{WORD_OF_THE_DAY.example}</p>
                <p className="text-xs text-slate-400 mt-0.5">{WORD_OF_THE_DAY.exampleTl}</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Flame size={14} className="text-amber-500" />
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Motivasi Hari Ini</p>
              </div>
              <div>
                <p className="text-4xl font-black text-slate-900 mb-1">継続は力なり</p>
                <p className="text-sm text-amber-500 font-medium italic mb-4">Kesinambungan adalah kekuatan</p>
                <p className="text-sm text-slate-600 leading-relaxed">Setiap hari sedikit — dalam setahun jadi ahli. Kamu sudah <span className="font-bold text-amber-600">{STREAK_DAYS} hari</span> berturut-turut!</p>
              </div>
              <div className="mt-5 pt-4 border-t border-amber-100 flex items-center gap-2">
                <Flame size={14} className="text-amber-500" />
                <p className="text-xs text-amber-500 font-semibold">Jangan putus streakmu hari ini!</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      <aside className="w-full xl:w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Produk Saya</p>
            <Link href="/products" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-0.5">
              Tambah <ChevronRight size={10} />
            </Link>
          </div>
          <div className="space-y-3">
            {isLoadingOwnedProducts && (
              <p className="text-xs text-slate-400 font-medium px-1">Memuat produk kamu...</p>
            )}
            {ownedProducts.map((product) => {
              const pct = PRODUCT_PROGRESS[product.id] ?? 0;
              return (
                <Link href={`/course?productId=${encodeURIComponent(product.id)}`} key={product.id} className="block p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      {product.level}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <p className="text-sm font-bold text-slate-900 truncate leading-tight">{product.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">{product.topicsCount} topik tersedia</p>
                    </div>
                    <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400">Progres</span>
                      <span className={cn('font-bold', pct > 0 ? 'text-indigo-500' : 'text-slate-400')}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-3">
          <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden group hover:shadow-xl transition-all">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-1.5">
                <Mail size={13} className="text-indigo-400" />
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Bantuan Premium</p>
              </div>
              <h4 className="font-bold text-base mb-3 leading-tight">Punya Kendala Belajar?</h4>
              <button className="w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors">
                Tanya Sensei Sekarang
              </button>
            </div>
            <div className="absolute -right-4 -bottom-4 grid grid-cols-4 gap-2 opacity-10 transform -rotate-12 group-hover:rotate-0 transition-transform duration-500">
              {Array.from({ length: 16 }).map((_, index) => (
                <div key={index} className="w-2 h-2 rounded-full bg-white" />
              ))}
            </div>
          </div>
        </div>
      </aside>
      </div>
    </RequireAuth>
  );
}
