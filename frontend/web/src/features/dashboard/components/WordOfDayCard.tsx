import { Star, Volume2 } from 'lucide-react';
import { Card } from '@/shared/components/ui';
import type { DashboardWordOfTheDay } from '../types/dashboard.types';

interface WordOfDayCardProps {
  wordOfTheDay: DashboardWordOfTheDay;
}

export function WordOfDayCard({ wordOfTheDay }: WordOfDayCardProps) {
  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star size={14} className="text-amber-400 fill-amber-400" />
          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kata Hari Ini</p>
        </div>
        <button className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600">
          <Volume2 size={14} />
        </button>
      </div>
      <p className="text-4xl font-bold text-slate-900 mb-1">{wordOfTheDay.word}</p>
      <p className="text-xs text-indigo-500 font-medium mb-3">{wordOfTheDay.reading}</p>
      <p className="text-sm font-semibold text-slate-700 mb-3">{wordOfTheDay.meaning}</p>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
        <p className="text-sm text-slate-700 font-medium">{wordOfTheDay.example}</p>
        <p className="text-xs text-slate-400 mt-0.5">{wordOfTheDay.exampleTl}</p>
      </div>
    </Card>
  );
}