export default function HowItWorksSection() {
  const HOME_STEPS: { num: string; title: string; desc: string }[] = [
    { num: '01', title: 'Buat Akun', desc: 'Daftar gratis dalam hitungan detik. Tidak perlu kartu kredit.' },
    { num: '02', title: 'Pilih Paket', desc: 'Temukan paket yang sesuai — JFT, JLPT, kanji, atau kosakata.' },
    {
      num: '03',
      title: 'Bayar & Akses',
      desc: 'Pembayaran aman via berbagai metode. Materi tersedia langsung setelah transaksi.',
    },
    { num: '04', title: 'Mulai Belajar', desc: 'Kerjakan soal, lacak progres, dan tingkatkan skor ujianmu.' },
  ];

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

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Cara Kerja</span>
            <span className="text-rose-300 text-xs select-none">✦</span>
          </div>
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">Mulai Belajar dalam 4 Langkah</h2>
          </div>
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
      </div>
    </section>
  );
}