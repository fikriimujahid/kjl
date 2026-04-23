import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "KeJepangDulu — Belajar Bahasa Jepang",
};

const featuredIds = ["PRODUCT_001", "PRODUCT_002", "PRODUCT_003", "PRODUCT_004"];
const featuredProducts = mockProducts.filter((p) => featuredIds.includes(p.id));

const stats = [
  { value: "1,200+", label: "Soal Tersedia" },
  { value: "500+", label: "Pengguna Aktif" },
  { value: "6", label: "Paket Belajar" },
  { value: "4.9★", label: "Rating Rata-rata" },
];

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Akses Instan",
    desc: "Setelah pembayaran berhasil, materi langsung tersedia tanpa perlu menunggu konfirmasi manual.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Konten Terlindungi",
    desc: "Semua materi tersimpan aman dan hanya dapat diakses oleh pengguna yang telah melakukan pembelian.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Mobile-Friendly",
    desc: "Tampilan dioptimalkan untuk semua perangkat. Belajar kapan saja dan di mana saja tanpa hambatan.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Akses Seumur Hidup",
    desc: "Beli sekali, akses selamanya. Tidak perlu berlangganan bulanan — materi selalu bisa diulang kapan pun.",
  },
];

const steps = [
  { num: "01", title: "Buat Akun", desc: "Daftar gratis dalam hitungan detik. Tidak perlu kartu kredit." },
  { num: "02", title: "Pilih Paket", desc: "Temukan paket yang sesuai — JFT, JLPT, kanji, atau kosakata." },
  { num: "03", title: "Bayar & Akses", desc: "Pembayaran aman via berbagai metode. Materi tersedia langsung setelah transaksi." },
  { num: "04", title: "Mulai Belajar", desc: "Kerjakan soal, lacak progres, dan tingkatkan skor ujianmu." },
];

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white overflow-hidden">
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Decorative glows */}
        <div className="absolute -top-32 -right-32 w-[480px] h-[480px] bg-primary-400 rounded-full opacity-20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-[360px] h-[360px] bg-accent-500 rounded-full opacity-15 blur-3xl pointer-events-none" />

        {/* Floating Japanese characters */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden" aria-hidden>
          <span className="absolute top-10 left-[8%] text-7xl font-bold text-white/5 rotate-12">日</span>
          <span className="absolute top-28 right-[10%] text-6xl font-bold text-white/5 -rotate-6">本</span>
          <span className="absolute bottom-16 left-[18%] text-8xl font-bold text-white/5 rotate-3">語</span>
          <span className="absolute bottom-8 right-[20%] text-5xl font-bold text-white/5 rotate-12">学</span>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-36 flex flex-col items-center text-center gap-7">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 text-sm font-medium tracking-wide backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-400" />
            </span>
            Platform eLearning Bahasa Jepang #1
          </span>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight max-w-3xl">
            Kuasai Bahasa Jepang,{" "}
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-accent-300">Raih Impianmu</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <path
                  d="M2 9C60 3 150 1 298 9"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="text-accent-400/60"
                />
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg text-primary-100 max-w-2xl leading-relaxed">
            Ribuan soal latihan JLPT & JFT — kanji, kosakata, tata bahasa, dan listening.
            Didesain untuk mempersiapkan kamu lulus ujian dengan percaya diri.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 mt-1 w-full sm:w-auto">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-accent-500 text-white font-bold text-base hover:bg-accent-600 transition-all shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400"
            >
              Mulai Gratis Sekarang
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white/10 text-white font-bold text-base hover:bg-white/20 border border-white/20 transition-all backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              Lihat Semua Produk
            </Link>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-6 pt-6 border-t border-white/15 w-full max-w-xl">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-extrabold text-white">{s.value}</span>
                <span className="text-xs text-primary-200 font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust strip ───────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-gray-400 font-medium">
          <span className="text-gray-300">Dipercaya oleh pelajar yang mempersiapkan:</span>
          {["JLPT N5", "JLPT N4", "JLPT N3", "JFT Basic", "JFT A2"].map((tag) => (
            <span key={tag} className="px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-xs font-semibold">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-2">Produk Unggulan</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
              Paket Belajar Terpopuler
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md">
              Dipilih oleh ratusan pelajar untuk persiapan ujian JLPT dan JFT.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
          >
            Lihat semua
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 sm:hidden text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Lihat semua produk
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────── */}
      <section className="bg-gray-50 border-y border-gray-200 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-2">Cara Kerja</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Mulai Belajar dalam 4 Langkah</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <div key={step.num} className="relative flex flex-col gap-4 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-9 left-full w-6 h-px bg-gray-200 z-10" />
                )}
                <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary-50 text-primary-700 font-extrabold text-sm border border-primary-100">
                  {step.num}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Section ───────────────────────────────────────── */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-2">Keunggulan</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">Kenapa Pilih KeJepangDulu?</h2>
            <p className="text-gray-500 mt-3 max-w-lg mx-auto text-sm sm:text-base">
              Kami membangun platform ini dengan satu tujuan — membantu kamu lulus ujian lebih cepat dan efisien.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((item) => (
              <div
                key={item.title}
                className="group flex flex-col gap-4 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-600 text-white group-hover:bg-primary-700 transition-colors">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1.5">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonial strip ─────────────────────────────────── */}
      <section className="bg-primary-50 border-y border-primary-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-widest mb-2">Testimoni</p>
            <h2 className="text-2xl font-extrabold text-gray-900">Apa Kata Mereka?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "Rizky A.",
                tag: "Lulus JFT A2",
                quote: "Soal-soalnya mirip banget sama ujian asli. Dalam 3 minggu intensif pakai KeJepangDulu, saya berhasil lulus JFT A2!",
              },
              {
                name: "Dewi S.",
                tag: "JLPT N4",
                quote: "Antarmukanya bersih dan mudah dipakai. Saya bisa latihan di HP sambil commute. Sangat membantu persiapan JLPT saya.",
              },
              {
                name: "Budi H.",
                tag: "JFT Basic",
                quote: "Harganya sangat terjangkau tapi kualitas soal tidak murahan. Worth it banget untuk persiapan kerja ke Jepang.",
              },
            ].map((t) => (
              <div key={t.name} className="flex flex-col gap-4 bg-white rounded-2xl p-6 border border-primary-100 shadow-sm">
                {/* Stars */}
                <div className="flex gap-0.5 text-accent-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-primary-600 font-medium">{t.tag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 rounded-3xl p-8 sm:p-16 text-white flex flex-col sm:flex-row items-center justify-between gap-8">
          {/* Background decoration */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary-500 rounded-full opacity-20 blur-3xl" />
            <div className="absolute -bottom-12 left-1/4 w-48 h-48 bg-accent-500 rounded-full opacity-15 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-4 text-center sm:text-left">
            <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight max-w-lg">
              Siap Mewujudkan Mimpi<br className="hidden sm:block" /> Bekerja & Belajar di Jepang?
            </h2>
            <p className="text-primary-200 max-w-md text-sm sm:text-base leading-relaxed">
              Bergabunglah dengan 500+ pelajar yang sudah mempercayakan persiapan ujian mereka ke KeJepangDulu.
            </p>
          </div>

          <div className="relative flex flex-col items-center gap-3 shrink-0">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-all shadow-xl shadow-black/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
            >
              Buat Akun Gratis
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <span className="text-xs text-primary-300">Gratis · Tidak perlu kartu kredit</span>
          </div>
        </div>
      </section>
    </>
  );
}
