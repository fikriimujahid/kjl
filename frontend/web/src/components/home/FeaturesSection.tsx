import type { ReactNode } from 'react';
import { CheckCircle, Lock, Smartphone, Zap } from 'lucide-react';

export default function FeaturesSection() {
  const FEATURE_ICONS: Record<string, ReactNode> = {
    zap: <Zap size={22} />,
    lock: <Lock size={22} />,
    smartphone: <Smartphone size={22} />,
    'check-circle': <CheckCircle size={22} />,
  };

  const HOME_FEATURES: { icon: string; title: string; desc: string }[] = [
    {
      icon: 'zap',
      title: 'Akses Instan',
      desc: 'Setelah pembayaran berhasil, materi langsung tersedia tanpa perlu menunggu konfirmasi manual.',
    },
    {
      icon: 'lock',
      title: 'Materi Terstruktur & Terpercaya',
      desc: 'Semua materi disusun secara sistematis dan mengikuti standar ujian terbaru, sehingga kamu belajar dengan arah yang jelas.',
    },
    {
      icon: 'smartphone',
      title: 'Mobile-Friendly',
      desc: 'Tampilan dioptimalkan untuk semua perangkat. Belajar kapan saja dan di mana saja tanpa hambatan.',
    },
    {
      icon: 'check-circle',
      title: 'Akses Fleksibel',
      desc: 'Durasi akses disesuaikan dengan paket yang dipilih, sehingga kamu bisa belajar sesuai kebutuhan.',
    },
  ];

  return (
    <section className="py-24 px-4 bg-slate-950 border-b border-white/10 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(99,102,241,0.13) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="absolute bottom-0 right-0 text-[200px] font-black text-white/[0.04] select-none pointer-events-none leading-none">特徴</div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-rose-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="max-w-2xl mb-16">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-rose-400 text-xs font-black tracking-[0.2em] uppercase">Keunggulan</span>
            <span className="text-rose-700 text-xs select-none">✦</span>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">Kenapa Pilih KeJepangDulu?</h2>
            <p className="font-medium text-lg text-slate-400 leading-relaxed">
              Kami membangun platform ini dengan satu tujuan — membantu kamu lulus ujian lebih cepat dan efisien.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {HOME_FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/5 backdrop-blur-sm p-8 rounded-3xl border border-white/10 hover:bg-white/10 hover:border-indigo-400/30 hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl text-white flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/20">
                {FEATURE_ICONS[feature.icon]}
              </div>
              <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}