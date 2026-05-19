import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/utils/classnames';

export default function HeroSection() {
  const HOME_STATS: { value: string; label: string }[] = [
    { value: '1,200+', label: 'Soal Tersedia' },
    { value: '500+', label: 'Pengguna Aktif' },
    { value: '6', label: 'Paket Belajar' },
    { value: '4.9★', label: 'Rating Rata-rata' },
  ];
  const EXAM_PREPARATION_TAGS: string[] = ['JLPT N5', 'JLPT N4', 'JLPT N3', 'JFT Basic', 'JFT A2'];

  return (
    <>
      <section className="relative pt-32 pb-28 md:pt-44 md:pb-36 px-4 bg-slate-950 overflow-hidden text-center flex flex-col items-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.18) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        <div className="absolute -top-2 right-[-1rem] md:right-10 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">合格</div>
        <div className="absolute bottom-4 left-[-1rem] md:left-8 text-[220px] font-black text-white/[0.045] select-none pointer-events-none leading-none tracking-tighter">頑張</div>
        <div className="absolute top-0 left-1/2 w-[600px] h-[400px] bg-indigo-600/25 rounded-full blur-[130px] -translate-x-1/2 -translate-y-1/3 pointer-events-none" />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-rose-600/20 rounded-full blur-[110px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-violet-600/20 rounded-full blur-[110px] pointer-events-none" />

        <div className={cn('max-w-7xl mx-auto relative z-10', "max-w-4xl flex flex-col items-center")}>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center w-full"
          >
            <div className={cn('flex items-center gap-2', "inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8")}> 
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
              <span className="text-xs font-bold text-white/90 uppercase tracking-widest">"Platform eLearning Bahasa Jepang"</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05] mb-6">
              Kuasai Bahasa Jepang,{' '}
              <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                Raih Impianmu
              </span>
            </h1>

            <div className="flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-indigo-400/60" />
              <span className="text-indigo-400/80 text-sm font-bold tracking-[0.3em]">日本語マスター</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-indigo-400/60" />
            </div>

            <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              Ribuan soal latihan JLPT &amp; JFT — kanji, kosakata, tata bahasa, dan listening. Didesain untuk mempersiapkan kamu lulus ujian dengan percaya diri.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full max-w-xs sm:max-w-none">
              <Link
                href="/register"
                className="px-8 py-4 w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:from-indigo-400 hover:to-violet-400 transition-all shadow-xl shadow-indigo-500/30 flex items-center justify-center gap-2"
              >
                Mulai Gratis Sekarang <ArrowRight size={16} />
              </Link>
              <Link
                href="/products"
                className="px-8 py-4 w-full sm:w-auto border border-white/25 text-white/90 rounded-xl font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 group backdrop-blur-sm"
              >
                Lihat Semua Produk
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="mt-14 w-full max-w-2xl mx-auto border-t border-white/10 pt-10 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6">
              {HOME_STATS.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-black text-white tracking-tight">{stat.value}</div>
                  <div className="text-xs text-slate-400 font-semibold mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center gap-3">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-widest">Dipercaya oleh pelajar yang mempersiapkan:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {EXAM_PREPARATION_TAGS.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 bg-white/10 border border-white/20 text-white/80 rounded-full text-xs font-bold hover:bg-white/20 hover:text-white transition-colors cursor-default backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full bg-slate-950 leading-none overflow-hidden -mb-px">
        <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,42 C240,80 480,10 720,42 C960,74 1200,10 1440,42 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </>
  );
}