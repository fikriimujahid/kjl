import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { EXAM_PREPARATION_TAGS, HOME_STATS } from '@/components/home/data/stats';
import { HeroBackground } from '@/components/home/HeroBackground';
import { Container } from '@/components/home/shared/Container';
import { SectionBadge } from '@/components/home/shared/SectionBadge';

export function HeroSection() {
  return (
    <>
      <section className="relative pt-32 pb-28 md:pt-44 md:pb-36 px-4 bg-slate-950 overflow-hidden text-center flex flex-col items-center">
        <HeroBackground />

        <Container className="max-w-4xl flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="flex flex-col items-center w-full"
          >
            <SectionBadge
              label="Platform eLearning Bahasa Jepang"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full mb-8"
              labelClassName="text-xs font-bold text-white/90 uppercase tracking-widest"
              leftIcon={<span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />}
            />

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
        </Container>
      </section>

      <div className="w-full bg-slate-950 leading-none overflow-hidden -mb-px">
        <svg viewBox="0 0 1440 64" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
          <path fill="#f8fafc" d="M0,42 C240,80 480,10 720,42 C960,74 1200,10 1440,42 L1440,64 L0,64 Z" />
        </svg>
      </div>
    </>
  );
}
