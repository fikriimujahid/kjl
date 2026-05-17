'use client';

import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Section } from '@/shared/components/ui';
import {
  ActivityChart,
  DashboardHeader,
  MotivationCard,
  OwnedProducts,
  PremiumHelpCard,
  WordOfDayCard,
} from './components';
import {
  DAILY_ACTIVITY,
  DAYS_SHORT,
  PRODUCT_PROGRESS,
  STREAK_DAYS,
  WORD_OF_THE_DAY,
} from './constants/dashboard.constants';
import { useOwnedProducts } from '@/features/products/hooks/useOwnedProducts';
import { getTodayIndex } from './utils/dashboard.utils';

export function DashboardPage() {
  const { status, user, accessToken } = useAuth();
  const { ownedProducts, isLoadingOwnedProducts } = useOwnedProducts({
    status,
    userId: user?.id,
    accessToken,
  });
  const todayIndex = getTodayIndex();

  return (
    <RequireAuth>
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-4rem-2.5rem)] bg-slate-50 overflow-hidden">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Section className="max-w-5xl mx-auto space-y-6">
            <DashboardHeader userName={user?.name} />
            <ActivityChart
              activityWeeks={DAILY_ACTIVITY}
              daysShort={DAYS_SHORT}
              streakDays={STREAK_DAYS}
              todayIndex={todayIndex}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <WordOfDayCard wordOfTheDay={WORD_OF_THE_DAY} />
              <MotivationCard streakDays={STREAK_DAYS} />
            </div>
          </Section>
        </main>

        <aside className="w-full xl:w-[320px] bg-white border-l border-slate-200 flex flex-col shrink-0 overflow-y-auto">
          <OwnedProducts
            isLoadingOwnedProducts={isLoadingOwnedProducts}
            ownedProducts={ownedProducts}
            productProgress={PRODUCT_PROGRESS}
          />

          <div className="p-6 space-y-3">
            <PremiumHelpCard />
          </div>
        </aside>
      </div>
    </RequireAuth>
  );
}