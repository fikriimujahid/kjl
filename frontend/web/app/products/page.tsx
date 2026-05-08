'use client';

import { useEffect, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';
import { fetchProducts } from '@/lib/products';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [productItems, setProductItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      const products = await fetchProducts({ signal: controller.signal });
      if (!controller.signal.aborted) {
        setProductItems(products);
        setLoading(false);
      }
    }

    loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  const levels = ['All', 'JFT', 'Beginner'];

  const filteredProducts = productItems.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'All' || product.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">Daftar Program Pembelajaran</h1>
        <p className="text-slate-500 font-medium">Pilih paket belajar yang sesuai dengan level dan target ujianmu.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-10 items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Cari program belajar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-50 transition-all font-medium"
          />
        </div>

        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto w-full md:w-auto no-scrollbar">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={cn(
                'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
                selectedLevel === level
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800',
              )}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm h-full flex flex-col animate-pulse">
              <div className="p-6 md:p-8 flex-grow flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-6 w-16 bg-slate-100 rounded-md" />
                  <div className="w-10 h-10 bg-slate-100 rounded-2xl" />
                </div>
                <div className="h-6 w-3/4 bg-slate-200 rounded-md mb-2" />
                <div className="h-4 w-full bg-slate-100 rounded-md mb-1.5" />
                <div className="h-4 w-5/6 bg-slate-100 rounded-md mb-1.5" />
                <div className="h-4 w-2/3 bg-slate-100 rounded-md" />
                <div className="flex gap-3 mt-auto pt-6">
                  <div className="h-4 w-20 bg-slate-100 rounded-md" />
                  <div className="h-4 w-20 bg-slate-100 rounded-md" />
                </div>
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
                  <div>
                    <div className="h-3 w-24 bg-slate-100 rounded mb-1.5" />
                    <div className="h-5 w-20 bg-slate-200 rounded" />
                  </div>
                  <div className="h-9 w-20 bg-slate-200 rounded-xl" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredProducts.map((product) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
            <BookOpen size={40} />
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Produk Tidak Ditemukan</h3>
          <p className="text-slate-500 font-medium">Coba gunakan kata kunci atau filter level lainnya.</p>
        </div>
      )}
    </div>
  );
}