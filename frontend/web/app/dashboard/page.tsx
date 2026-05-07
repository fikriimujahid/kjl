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
import { useAuth } from '@/components/AuthProvider';
import { Product } from '@/lib/types';
import { loadOwnedProducts } from '@/lib/products';

const STREAK_DAYS = 7;
const DAILY_GOAL_XP = 80;
const WORD_OF_THE_DAY = {
  word: '頑張る',
  reading: 'がんばる · ganbaru',
  meaning: 'Berusaha keras; pantang menyerah',
  example: '毎日頑張っています。',
  exampleTl: 'Saya berusaha keras setiap hari.',
};
const EXAM_DATE = new Date('2026-05-15');
const PRODUCT_PROGRESS: Record<string, number> = { p1: 42, p3: 17 };
const WEEKLY_ACTIVITY = [60, 80, 40, 100, 75, 90, DAILY_GOAL_XP];
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
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-amber-100">
                <Flame size={12} className="fill-amber-500 text-amber-500" />
                {STREAK_DAYS} Hari Berturut-turut 🔥
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-1">
                Selamat datang kembali, <span className="text-indigo-600">{user?.name ?? 'Pengguna'}</span>!
              </h1>
              <p className="text-slate-500 text-sm font-medium">Streakmu sedang on-fire — jangan putus hari ini!</p>
            </div>
            <Link href="/my-learning" className="relative z-10 bg-indigo-600 text-white px-7 py-3.5 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all w-full sm:w-auto justify-center">
              <PlayCircle size={18} />
              Lanjutkan Belajar
            </Link>
          </motion.header>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {[
              { icon: <Flame size={18} className="text-orange-500" />, bg: 'bg-orange-50', value: `${STREAK_DAYS} hari`, label: 'Streak Aktif' },
              { icon: <Trophy size={18} className="text-amber-500" />, bg: 'bg-amber-50', value: '3', label: 'Pencapaian' },
              { icon: <BookOpen size={18} className="text-indigo-500" />, bg: 'bg-indigo-50', value: `${ownedProducts.reduce((sum, product) => sum + product.topicsCount, 0)}`, label: 'Total Topik' },
              { icon: <Zap size={18} className="text-emerald-500" />, bg: 'bg-emerald-50', value: `${DAILY_GOAL_XP} XP`, label: 'XP Hari Ini' },
            ].map(({ icon, bg, value, label }) => (
              <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>{icon}</div>
                <div>
                  <p className="text-xl font-bold text-slate-900 leading-none mb-0.5">{value}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
          >
            {recentProduct && (
              <Link href="/my-learning" className="md:col-span-3 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white flex flex-col gap-4 hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-200 group">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-200 mb-1">Lanjutkan</p>
                    <h3 className="font-bold text-lg leading-snug">{recentProduct.name}</h3>
                    <p className="text-indigo-200 text-xs mt-1">{recentProduct.topicsCount} topik · Level {recentProduct.level}</p>
                  </div>
                  <div className="bg-white/20 p-2.5 rounded-xl group-hover:bg-white/30 transition-colors shrink-0">
                    <PlayCircle size={22} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-indigo-200 mb-1.5">
                    <span>Progres</span>
                    <span className="font-bold text-white">{PRODUCT_PROGRESS[recentProduct.id] ?? 0}%</span>
                  </div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white rounded-full transition-all" style={{ width: `${PRODUCT_PROGRESS[recentProduct.id] ?? 0}%` }} />
                  </div>
                </div>
              </Link>
            )}

            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-indigo-500" />
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Target Harian</p>
                </div>
                <span className="text-[10px] font-bold text-slate-400">{DAILY_GOAL_XP}/100 XP</span>
              </div>

              <div className="flex items-center gap-5">
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#e2e8f0" strokeWidth="6" />
                    <circle
                      cx="32"
                      cy="32"
                      r="26"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - DAILY_GOAL_XP / 100)}`}
                      className="transition-all"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-900">{DAILY_GOAL_XP}%</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-600">2 kuis diselesaikan</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                    <p className="text-xs text-slate-600">1 topik dibaca</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-[13px] h-[13px] rounded-full border-2 border-slate-300 shrink-0" />
                    <p className="text-xs text-slate-400">20 XP tersisa</p>
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
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={14} className="text-indigo-500" />
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Aktivitas Minggu Ini</p>
              </div>
              <div className="flex items-end justify-between gap-1.5 h-20">
                {WEEKLY_ACTIVITY.map((pct, index) => (
                  <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
                    <div className="w-full rounded-t-lg overflow-hidden bg-slate-100" style={{ height: '64px' }}>
                      <div
                        className={cn(
                          'w-full rounded-t-lg transition-all',
                          index === today ? 'bg-indigo-500' : pct === 100 ? 'bg-emerald-400' : 'bg-indigo-200',
                        )}
                        style={{ height: `${pct}%`, marginTop: `${100 - pct}%` }}
                      />
                    </div>
                    <span className={cn('text-[10px] font-bold', index === today ? 'text-indigo-600' : 'text-slate-400')}>
                      {DAYS_SHORT[index]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
                <TrendingUp size={13} className="text-emerald-500" />
                <span>Rata-rata <span className="font-bold text-slate-700">74 XP/hari</span> minggu ini — lebih baik dari minggu lalu!</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pencapaian Terbaru</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 cursor-pointer uppercase tracking-wider">Lihat Semua</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {RECENT_ACHIEVEMENTS.map(({ label, icon }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50 transition-colors cursor-default text-center">
                  <span className="text-2xl">{icon}</span>
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">{label}</span>
                </div>
              ))}
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
                <Link href={`/course/${product.id}`} key={product.id} className="block p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
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
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
            <p className="text-lg font-black text-amber-600 mb-0.5">継続は力なり</p>
            <p className="text-[11px] text-amber-500 font-medium italic mb-2">Kesinambungan adalah kekuatan</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">Setiap hari sedikit — dalam setahun jadi ahli. Kamu sudah {STREAK_DAYS} hari berturut-turut!</p>
          </div>

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
