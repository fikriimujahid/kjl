import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Halaman Tidak Ditemukan" };

export default function NotFound() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="flex flex-col items-center text-center gap-5 max-w-sm">
        {/* 404 graphic */}
        <div className="w-24 h-24 rounded-3xl bg-primary-50 flex items-center justify-center">
          <span className="text-4xl font-extrabold text-primary-300">404</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-gray-500 mt-2">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold text-center hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Ke Beranda
          </Link>
          <Link
            href="/products"
            className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold text-center hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Lihat Produk
          </Link>
        </div>
      </div>
    </div>
  );
}
