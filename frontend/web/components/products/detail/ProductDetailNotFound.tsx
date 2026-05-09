import Link from 'next/link';
import { ChevronLeft, BookOpen } from 'lucide-react';

export default function ProductDetailNotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-10 hover:-translate-x-1 transition-transform">
        <ChevronLeft size={20} />
        Kembali ke Produk
      </Link>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen size={36} className="text-gray-300" />
        </div>
        <h2 className="text-2xl font-black text-gray-800 mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-gray-400 font-medium">Produk yang kamu cari tidak tersedia atau sudah tidak aktif.</p>
      </div>
    </div>
  );
}
