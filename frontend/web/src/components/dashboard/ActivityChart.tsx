import { BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/utils/classnames';
import { DashboardActivityWeek } from '@/types/dashboard';
import { getActivityCellState } from '@/utils/dashboard';

interface ActivityChartProps {
  activityWeeks: DashboardActivityWeek[];
  daysShort: readonly string[];
  streakDays: number;
  todayIndex: number;
}

export function ActivityChart({
  activityWeeks,
  daysShort,
  streakDays,
  todayIndex,
}: ActivityChartProps) {
  return (
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
            {activityWeeks.map((week, weekIndex) => (
              <div key={week.label}>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">{week.label}</p>
                <div className="flex items-end justify-between gap-0.5 sm:gap-1" style={{ height: '52px' }}>
                  {week.values.map((pct, dayIndex) => {
                    const { isToday, isFuture } = getActivityCellState(
                      weekIndex,
                      dayIndex,
                      todayIndex,
                      activityWeeks.length,
                    );

                    return (
                      <div key={daysShort[dayIndex]} className="flex flex-col items-center gap-1 flex-1">
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
                          {daysShort[dayIndex]}
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
              <p className="text-2xl font-black text-indigo-600">{streakDays}</p>
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
  );
}