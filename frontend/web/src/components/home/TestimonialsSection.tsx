export default function TestimonialsSection() {
  const HOME_TESTIMONIALS: { name: string; role: string; text: string }[] = [
    {
      name: 'Rizky A.',
      role: 'Lulus JFT A2',
      text: 'Soal-soalnya mirip banget sama ujian asli. Dalam 3 minggu intensif pakai KeJepangDulu, saya berhasil lulus JFT A2!',
    },
    {
      name: 'Dewi S.',
      role: 'JLPT N4',
      text: 'Antarmukanya bersih dan mudah dipakai. Saya bisa latihan di HP sambil commute. Sangat membantu persiapan JLPT saya.',
    },
    {
      name: 'Budi H.',
      role: 'JFT Basic',
      text: 'Harganya sangat terjangkau tapi kualitas soal tidak murahan. Worth it banget untuk persiapan kerja ke Jepang.',
    },
  ];

  return (
    <section className="py-24 px-4 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-4 left-2 md:left-10 text-[180px] font-black text-slate-200 select-none pointer-events-none leading-none opacity-70">「</div>

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="text-center mb-16">
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Testimoni</span>
            <span className="text-rose-300 text-xs select-none">✦</span>
          </div>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Apa Kata Mereka?</h2>
          </div>
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
      </div>
    </section>
  );
}