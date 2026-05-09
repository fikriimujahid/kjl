import { HOME_STEPS } from '@/components/home/data/steps';
import { Container } from '@/components/home/shared/Container';
import { SectionBadge } from '@/components/home/shared/SectionBadge';
import { SectionTitle } from '@/components/home/shared/SectionTitle';

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-white border-b border-slate-100 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(226,232,240,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(226,232,240,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />

      <Container>
        <div className="text-center mb-16">
          <SectionBadge
            label="Cara Kerja"
            className="justify-center mb-4"
            labelClassName="text-rose-500 text-xs font-black tracking-[0.2em] uppercase"
            rightIcon={<span className="text-rose-300 text-xs select-none">✦</span>}
          />
          <SectionTitle title="Mulai Belajar dalam 4 Langkah" className="text-center" titleClassName="text-slate-900" />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12 relative">
          <div className="absolute top-7 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-violet-300 to-indigo-200 hidden lg:block pointer-events-none" />

          {HOME_STEPS.map((step) => (
            <div key={step.num} className="flex flex-col items-center text-center group">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:-translate-y-1 transition-transform duration-300 relative z-10">
                <span className="text-lg font-black text-white">{step.num}</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
