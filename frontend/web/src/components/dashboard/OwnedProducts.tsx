import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { OwnedProduct } from '@/types/product';
import { DashboardProductProgress } from '@/types/dashboard';

interface OwnedProductsProps {
  isLoadingOwnedProducts: boolean;
  ownedProducts: OwnedProduct[];
  productProgress: DashboardProductProgress;
}

export function OwnedProducts({
  isLoadingOwnedProducts,
  ownedProducts,
  productProgress,
}: OwnedProductsProps) {
  return (
    <div className="p-6 border-b border-slate-100 flex-1">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Produk Saya</p>
        <Link href="/products" className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider flex items-center gap-0.5">
          Tambah <ChevronRight size={10} />
        </Link>
      </div>
      <div className="space-y-3">
        {isLoadingOwnedProducts && (
          <p className="text-xs text-slate-400 font-medium px-1">Memuat produk kamu...</p>
        )}
        {!isLoadingOwnedProducts && ownedProducts.length === 0 && (
          <p className="text-xs text-slate-400 font-medium px-1">Belum ada produk yang dimiliki.</p>
        )}
        {ownedProducts.map((product) => {
          const pct = productProgress[product.id] || 0;

          return (
            <Link href={`/course?productId=${encodeURIComponent(product.productId)}`} key={product.productId} className="block p-4 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-md transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 text-xs group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  {product.level}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-sm font-bold text-slate-900 leading-tight">{product.name}</p>
                </div>
                <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
              </div>
              {/* <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-slate-400">Progres</span>
                  <span className={cn('font-bold', pct > 0 ? 'text-indigo-500' : 'text-slate-400')}>{pct}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div> */}
            </Link>
          );
        })}
      </div>
    </div>
  );
}