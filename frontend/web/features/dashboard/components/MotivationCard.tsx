import { Flame } from 'lucide-react';
import { Card } from '@/shared/components/ui';

interface MotivationCardProps {
  streakDays: number;
}

export function MotivationCard({ streakDays }: MotivationCardProps) {
  return (
    <Card className="rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={14} className="text-amber-500" />
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Motivasi Hari Ini</p>
      </div>
      <div>
        <p className="text-4xl font-black text-slate-900 mb-1">継続は力なり</p>
        <p className="text-sm text-amber-500 font-medium italic mb-4">Kesinambungan adalah kekuatan</p>
        <p className="text-sm text-slate-600 leading-relaxed">Setiap hari sedikit — dalam setahun jadi ahli. Kamu sudah <span className="font-bold text-amber-600">{streakDays} hari</span> berturut-turut!</p>
      </div>
      <div className="mt-5 pt-4 border-t border-amber-100 flex items-center gap-2">
        <Flame size={14} className="text-amber-500" />
        <p className="text-xs text-amber-500 font-semibold">Jangan putus streakmu hari ini!</p>
      </div>
    </Card>
  );
}