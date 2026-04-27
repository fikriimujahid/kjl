'use client';

import React, { useEffect, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { Product } from '@/lib/types';

const PRODUCT_URL = process.env.NEXT_PUBLIC_PRODUCT_URL ?? '';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');
  const [productItems, setProductItems] = useState<Product[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchProducts() {
      try {
        const response = await fetch(PRODUCT_URL, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to fetch products: ${response.status}`);
        }

        const data = await response.json();
        const products = Array.isArray(data)
          ? data
          : Array.isArray(data?.catalog)
            ? data.catalog
            : [];

        setProductItems(products as Product[]);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }

        console.error('Failed to load product data for Products page.', error);
        setProductItems([]);
      }
    }

    fetchProducts();

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
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">Katalog Program Pembelajaran</h1>
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

      {filteredProducts.length > 0 ? (
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