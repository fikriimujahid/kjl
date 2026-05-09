import { motion } from 'motion/react';
import { ProductCard } from '@/components/ProductCard';
import { ProductSkeleton } from '@/components/home/ProductSkeleton';
import { ProductsStateMessage } from '@/components/products/ProductsStateMessage';
import { Product } from '@/lib/types';

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
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ProductsStateMessage
        title="Gagal Memuat Produk"
        description="Silakan muat ulang halaman untuk mencoba lagi."
      />
    );
  }

  if (products.length === 0) {
    return (
      <ProductsStateMessage
        title="Produk Tidak Ditemukan"
        description="Coba gunakan kata kunci atau filter level lainnya."
      />
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
