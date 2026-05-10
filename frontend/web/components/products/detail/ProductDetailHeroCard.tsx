import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductDetailHeroCardProps {
  level: string;
  name: string;
}

export function ProductDetailHeroCard({ level, name }: ProductDetailHeroCardProps) {
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="relative">
      <div className="w-full aspect-[4/3] bg-gradient-to-br from-indigo-50 to-slate-100 rounded-[3rem] shadow-sm border border-indigo-100 flex flex-col items-center justify-center p-10 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookOpen size={240} className="text-indigo-900" />
        </div>
        <div className="relative z-10 w-24 h-24 bg-white rounded-3xl shadow-md border border-slate-100 flex items-center justify-center mb-8">
          <span className="text-3xl font-black text-indigo-600">{level}</span>
        </div>
        <h2 className="relative z-10 text-3xl font-bold text-slate-800 mb-2">{name}</h2>
        <p className="relative z-10 text-sm font-bold text-slate-500 uppercase tracking-widest">Platform Modul Eksperiensial</p>
      </div>
    </motion.div>
  );
}
