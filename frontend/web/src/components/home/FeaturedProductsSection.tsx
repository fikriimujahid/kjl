import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCardSkeleton } from '@/components/products/ProductCardSkeleton';
import { useProducts } from '@/hooks/useProducts';

export default function FeaturedProductsSection() {
  const { products, loading } = useProducts();

  const featuredProducts = products.filter((product) => product.featuredProducts);

  return (
    <section className="py-24 px-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
      <div className="absolute top-6 right-2 md:right-8 text-[160px] font-black text-slate-200 select-none pointer-events-none leading-none">練習</div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-rose-500 text-xs font-black tracking-[0.2em] uppercase">Produk Unggulan</span>
              <span className="text-rose-300 text-xs select-none">✦</span>
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-3">Paket Belajar Terpopuler</h2>
              <p className="font-medium text-lg text-slate-500">Dipilih oleh ratusan pelajar untuk persiapan ujian JLPT dan JFT.</p>
            </div>
          </div>
          <Link
            href="/products"
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            Lihat semua <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)
            : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="mt-12 text-center">
          <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Lihat semua produk <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}