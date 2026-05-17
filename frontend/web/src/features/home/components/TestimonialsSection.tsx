import { HOME_TESTIMONIALS } from '../data';
import { Container, SectionBadge, SectionTitle } from './shared';

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-4 left-2 md:left-10 text-[180px] font-black text-slate-200 select-none pointer-events-none leading-none opacity-70">「</div>

      <Container className="w-full">
        <div className="text-center mb-16">
          <SectionBadge
            label="Testimoni"
            className="justify-center mb-4"
            labelClassName="text-rose-500 text-xs font-black tracking-[0.2em] uppercase"
            rightIcon={<span className="text-rose-300 text-xs select-none">✦</span>}
          />
          <SectionTitle title="Apa Kata Mereka?" className="text-center" titleClassName="text-slate-900" />
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {HOME_TESTIMONIALS.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 hover:-translate-y-1 transition-all duration-300 flex flex-col"
            >
              <div className="flex gap-0.5 mb-5">
                {Array.from({ length: 5 }).map((_, star) => (
                  <span key={star} className="text-amber-400 text-base">★</span>
                ))}
              </div>
              <p className="mb-8 font-medium leading-relaxed text-slate-600 flex-1">&quot;{testimonial.text}&quot;</p>
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md shadow-indigo-100 text-sm">
                  {testimonial.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-xs text-slate-500 font-semibold">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}