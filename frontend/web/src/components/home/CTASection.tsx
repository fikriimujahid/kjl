import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-32 px-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 relative overflow-hidden flex justify-center">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-indigo-600/20 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-violet-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-4 right-6 md:right-16 text-[180px] font-black text-white/[0.04] select-none pointer-events-none leading-none">成功</div>

      <div className="max-w-7xl mx-auto relative z-10 max-w-3xl w-full text-center">
        <div className="flex items-center gap-2 inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full justify-center mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">Bergabung Sekarang</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
          Siap Mewujudkan Mimpi
          <br className="hidden md:block" />
          Bekerja &amp; Belajar di Jepang?
        </h2>
        <p className="text-indigo-200 text-lg md:text-xl mb-12 leading-relaxed font-medium">
          Bergabunglah dengan 500+ pelajar yang sudah mempercayakan persiapan ujian mereka ke KeJepangDulu.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-900 rounded-xl font-bold transition-all shadow-2xl hover:bg-slate-50 text-lg hover:-translate-y-1"
        >
          Buat Akun Gratis <ArrowRight size={20} />
        </Link>
        <p className="mt-4 text-indigo-300/70 text-sm font-medium">Gratis · Tidak perlu kartu kredit</p>
      </div>
    </section>
  );
}