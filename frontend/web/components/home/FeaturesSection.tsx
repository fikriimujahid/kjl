import { ReactNode } from 'react';
import { CheckCircle, Lock, Smartphone, Zap } from 'lucide-react';
import { FeatureIcon, HOME_FEATURES } from '@/components/home/data/features';
import { Container } from '@/components/home/shared/Container';
import { SectionBadge } from '@/components/home/shared/SectionBadge';
import { SectionTitle } from '@/components/home/shared/SectionTitle';

const FEATURE_ICONS: Record<FeatureIcon, ReactNode> = {
  zap: <Zap size={22} />,
  lock: <Lock size={22} />,
  smartphone: <Smartphone size={22} />,
  'check-circle': <CheckCircle size={22} />,
};

export function FeaturesSection() {
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

      <Container>
        <div className="max-w-2xl mb-16">
          <SectionBadge
            label="Keunggulan"
            className="mb-4"
            labelClassName="text-rose-400 text-xs font-black tracking-[0.2em] uppercase"
            rightIcon={<span className="text-rose-700 text-xs select-none">✦</span>}
          />
          <SectionTitle
            title="Kenapa Pilih KeJepangDulu?"
            description="Kami membangun platform ini dengan satu tujuan — membantu kamu lulus ujian lebih cepat dan efisien."
            titleClassName="text-white mb-4"
            descriptionClassName="text-slate-400 leading-relaxed"
          />
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
      </Container>
    </section>
  );
}
