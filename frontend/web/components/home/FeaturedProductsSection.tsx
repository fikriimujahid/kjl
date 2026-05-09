import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/home/ProductSkeleton';
import { Container } from '@/components/home/shared/Container';
import { SectionBadge } from '@/components/home/shared/SectionBadge';
import { SectionTitle } from '@/components/home/shared/SectionTitle';
import { useProducts } from '@/hooks/useProducts';
import { getFeaturedProducts } from '@/lib/utils/product';

export function FeaturedProductsSection() {
  const { products, loading } = useProducts();

  const featuredProducts = getFeaturedProducts(products);

  return (
    <section className="py-24 px-4 bg-slate-50 border-b border-slate-100 relative overflow-hidden">
      <div className="absolute top-6 right-2 md:right-8 text-[160px] font-black text-slate-200 select-none pointer-events-none leading-none">練習</div>

      <Container>
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <SectionBadge
              label="Produk Unggulan"
              className="mb-4"
              labelClassName="text-rose-500 text-xs font-black tracking-[0.2em] uppercase"
              rightIcon={<span className="text-rose-300 text-xs select-none">✦</span>}
            />
            <SectionTitle
              title="Paket Belajar Terpopuler"
              description="Dipilih oleh ratusan pelajar untuk persiapan ujian JLPT dan JFT."
              titleClassName="text-slate-900 mb-3"
              descriptionClassName="text-slate-500"
            />
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
            ? Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)
            : featuredProducts.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>

        <div className="mt-12 text-center">
          <Link href="/products" className="inline-flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            Lihat semua produk <ArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </section>
  );
}
