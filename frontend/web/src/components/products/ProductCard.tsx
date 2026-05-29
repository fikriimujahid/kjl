'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/utils/classnames';
import { formatPrice } from '@/utils/formatters';
import type { Product } from '@/types/product';

interface ProductCardProps {
  product: Product;
  isOwned?: boolean;
}

export function ProductCard({ product, isOwned }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all h-full flex flex-col group relative"
    >
      <div className="absolute top-0 right-0 p-4 transition-transform group-hover:scale-110">
        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm relative overflow-hidden">
          <div className="absolute -right-2 -top-2 w-6 h-6 bg-indigo-100 rounded-full blur-md"></div>
          <BookOpen size={18} className="relative z-10" />
        </div>
      </div>

      <div className="p-6 md:p-8 flex-grow flex flex-col">
        <div className="pt-2">
          <span className="inline-flex items-center justify-center px-2.5 py-1 mb-4 rounded-md text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 uppercase tracking-widest">
            {product.level}
          </span>
          <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight pr-6">
            {product.name}
          </h3>
          <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-3">
            {product.shortDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-auto pt-6">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            {product.topicsCount} Topics
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
            Evaluasi Detail
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block mb-1 lg:mb-0">Akses {product.accessDurationDays} Hari</span>
            {product.normalPrice != null && product.normalPrice > product.price && (
              <span className="text-xs text-slate-400 line-through block">{formatPrice(product.normalPrice)}</span>
            )}
            <span className="text-lg font-bold text-slate-900 tracking-tight">
              {product.price === 0 ? 'Gratis' : formatPrice(product.price)}
            </span>
          </div>

          <Link
            href={isOwned ? '/my-learning' : `/products?productId=${encodeURIComponent(product.id)}`}
            className={cn(
              'px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-sm',
              isOwned
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 border border-indigo-600',
            )}
          >
            {isOwned ? 'Mulai Belajar' : 'Beli'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
}