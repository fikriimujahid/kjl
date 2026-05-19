import { motion } from 'motion/react';
import type { Product } from '@/types/product';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';
import { BookOpen } from 'lucide-react';

interface ProductsResultsProps {
  loading: boolean;
  error: string | null;
  products: Product[];
}

export function ProductsResults({ loading, error, products }: ProductsResultsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <ProductCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-32 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <BookOpen size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Gagal Memuat Produk</h3>
        <p className="text-slate-500 font-medium">Silakan muat ulang halaman untuk mencoba lagi.</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="py-32 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
          <BookOpen size={40} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2">Produk Tidak Ditemukan</h3>
        <p className="text-slate-500 font-medium">Coba gunakan kata kunci atau filter level lainnya.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {products.map((product) => (
        <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
}