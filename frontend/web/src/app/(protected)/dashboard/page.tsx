'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import {
  DAYS_SHORT,
  PRODUCT_PROGRESS,
  WORD_OF_THE_DAY,
} from '@/constants/dashboard';
import { useOwnedProducts } from '@/hooks/useOwnedProducts';
import { useDashboardCheckinActivity } from '@/hooks/useDashboardCheckinActivity';
import { cn } from '@/utils/classnames';
import { ActivityChart } from '@/components/dashboard/ActivityChart';
import { MotivationCard } from '@/components/dashboard/MotivationCard';
import { Mail } from 'lucide-react';
import { WordOfDayCard } from '@/components/dashboard/WordOfDayCard';
import { OwnedProducts } from '@/components/dashboard/OwnedProducts';

export default function DashboardPage() {
  const { status, user, accessToken } = useAuth();
  const { activityWeeks, streakDays } = useDashboardCheckinActivity({
    status,
    accessToken,
  });
  const { ownedProducts, isLoadingOwnedProducts } = useOwnedProducts({
    status,
    userId: user?.id,
    accessToken,
  });
  const todayIndex = new Date().getDay();

  return (
    <RequireAuth>
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-4rem-2.5rem)] bg-slate-50 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className={cn("max-w-5xl mx-auto space-y-6")}>
            <motion.header
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="px-1 py-2"
            >
              <h1 className="text-xl font-semibold text-slate-800">
                Selamat datang kembali, <span className="text-indigo-600">{user?.name ?? 'Pengguna'}</span>
              </h1>
            </motion.header>

            <ActivityChart
              activityWeeks={activityWeeks}
              daysShort={DAYS_SHORT}
              streakDays={streakDays}
              todayIndex={todayIndex}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WordOfDayCard wordOfTheDay={WORD_OF_THE_DAY} />
              <MotivationCard streakDays={streakDays} />
            </div>
          </div>
        </main>

        <aside className="w-full xl:w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <OwnedProducts
            isLoadingOwnedProducts={isLoadingOwnedProducts}
            ownedProducts={ownedProducts}
            productProgress={PRODUCT_PROGRESS}
          />

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