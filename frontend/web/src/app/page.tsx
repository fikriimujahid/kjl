import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/ui/ProductCard";
import { mockProducts } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "KeJepangDulu — Belajar Bahasa Jepang",
};

const featuredIds = ["PRODUCT_001", "PRODUCT_002", "PRODUCT_003", "PRODUCT_004"];
const featuredProducts = mockProducts.filter((p) => featuredIds.includes(p.id));

export default function HomePage() {
  return (
    <>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full" />
          <div className="absolute -bottom-10 -left-16 w-64 h-64 bg-accent-400 rounded-full" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-28 flex flex-col items-center text-center gap-6">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-sm font-medium tracking-wide">
            🇯🇵 Platform eLearning Bahasa Jepang
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight max-w-2xl">
            Belajar Bahasa Jepang <br className="hidden sm:block" />
            <span className="text-accent-300">Lebih Mudah</span>
          </h1>

          <p className="text-base sm:text-lg text-primary-100 max-w-xl leading-relaxed">
            Latihan soal JLPT dan JFT dengan materi lengkap — kanji, kosakata, tata bahasa,
            dan listening. Persiapan ujian jadi lebih terarah.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2 w-full sm:w-auto">
            <Link
              href="/products"
              className="px-8 py-3.5 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white text-center"
            >
              Lihat Produk
            </Link>
            <Link
              href="/register"
              className="px-8 py-3.5 rounded-xl bg-accent-500 text-white font-bold text-base hover:bg-accent-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 text-center"
            >
              Daftar Gratis
            </Link>
          </div>

          {/* Stats bar */}
          {/* <div className="flex flex-wrap justify-center gap-8 mt-6 text-sm text-primary-200">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">1,200+</span>
              <span>Soal Tersedia</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">500+</span>
              <span>Pengguna Aktif</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">6</span>
              <span>Paket Belajar</span>
            </div>
          </div> */}
        </div>
      </section>

      {/* ── Featured Products ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Produk Unggulan</h2>
            <p className="text-gray-500 mt-1 text-sm">Paket belajar terpopuler dari KeJepangDulu</p>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors hidden sm:block"
          >
            Lihat semua →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link
            href="/products"
            className="text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            Lihat semua produk →
          </Link>
        </div>
      </section>

      {/* ── Why Section ───────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-200 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            Kenapa KeJepangDulu?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: "⚡",
                title: "Akses Langsung",
                desc: "Setelah pembayaran berhasil, materi langsung bisa diakses tanpa menunggu konfirmasi manual.",
              },
              {
                icon: "🔒",
                title: "Konten Terlindungi",
                desc: "Semua materi disimpan secara aman dan hanya bisa diakses oleh pengguna yang sudah membeli.",
              },
              {
                icon: "📱",
                title: "Mobile-Friendly",
                desc: "Tampilan dioptimalkan untuk HP. Belajar kapan saja dan di mana saja tanpa hambatan.",
              },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl border border-gray-100">
                <span className="text-4xl">{item.icon}</span>
                <h3 className="font-bold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-12 text-white text-center flex flex-col items-center gap-5">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Siap Mewujudkan Mimpi Bekerja & Belajar di Jepang?</h2>
          <p className="text-primary-100 max-w-md text-sm sm:text-base">
            Akses materi eksklusif dan kuis interaktif yang dirancang oleh pakar bahasa untuk membantu Anda lulus JLPT lebih cepat.
          </p>
          <Link
            href="/register"
            className="px-8 py-3.5 rounded-xl bg-white text-primary-700 font-bold text-base hover:bg-primary-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Buat Akun Gratis
          </Link>
        </div>
      </section>
    </>
  );
}
