import { BookOpen, Check, Clock, Globe, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';
import { formatPrice } from '@/utils/formatters';
import { PRODUCT_LEARNING_FEATURES } from '@/constants/products';
import type { ProductDetail } from '@/types/product';

interface ProductOverviewPanelProps {
  productDetails: ProductDetail;
  isBuying: boolean;
  onBuy: () => void | Promise<void>;
}

export function ProductOverviewPanel({
  productDetails,
  isBuying,
  onBuy,
}: ProductOverviewPanelProps) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div>
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
          {productDetails.level}
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">{productDetails.name}</h1>
        <p className="text-lg text-gray-500 leading-relaxed font-medium">{productDetails.description}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <BookOpen className="text-indigo-500 mb-3" size={22} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Topik</p>
          <p className="text-xl font-black text-gray-900">{productDetails.topicsCount}</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <Clock className="text-orange-500 mb-3" size={22} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Akses</p>
          <p className="text-xl font-black text-gray-900">{productDetails.accessDurationDays} Hari</p>
        </div>
        <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
          <Globe className="text-teal-500 mb-3" size={22} />
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Format</p>
          <p className="text-xl font-black text-gray-900">Digital</p>
        </div>
      </div>

      <div className="bg-indigo-50 p-8 rounded-[2.5rem] border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-indigo-600 font-black uppercase text-xs tracking-widest mb-1">HARGA PRODUK</p>
          <p className="text-4xl font-black text-indigo-900">{formatPrice(productDetails.price)}</p>
        </div>
        <button
          onClick={onBuy}
          disabled={isBuying}
          className="w-full md:w-auto px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-3 disabled:cursor-not-allowed disabled:bg-indigo-400"
        >
          {isBuying ? 'Memproses...' : 'Beli Sekarang'}
          <ShoppingCart size={28} />
        </button>
      </div>

      <section>
        <h2 className="text-xl font-black text-gray-900 mb-4">Yang akan kamu pelajari:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PRODUCT_LEARNING_FEATURES.map((feature, index) => (
            <div key={index} className="flex gap-3 items-center p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                <Check size={16} strokeWidth={3} />
              </div>
              <span className="font-bold text-gray-700 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}