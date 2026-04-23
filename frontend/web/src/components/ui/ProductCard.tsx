import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatIDR } from "@/lib/mock-data";

interface ProductCardProps {
  product: Product;
  isOwned?: boolean;
  compact?: boolean;
}

export default function ProductCard({ product, isOwned = false, compact = false }: ProductCardProps) {
  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      {/* Color bar + badge */}
      <div className="h-2 bg-gradient-to-r from-primary-500 to-primary-400" />

      <div className={`flex flex-col flex-1 ${compact ? "p-4" : "p-5"}`}>
        {/* Badge */}
        {product.badge && (
          <span className="self-start mb-2 px-2 py-0.5 rounded-full text-xs font-semibold bg-accent-100 text-accent-600">
            {product.badge}
          </span>
        )}

        {/* Category chip */}
        <span className="self-start mb-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
          {product.category}
        </span>

        {/* Name */}
        <h3 className={`font-bold text-gray-900 leading-snug mb-2 ${compact ? "text-base" : "text-lg"}`}>
          {product.name}
        </h3>

        {/* Description */}
        {!compact && (
          <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {product.topicsCount} topik
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {product.questionsCount} soal
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Seumur hidup
          </span>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between mt-auto">
          <span className={`font-bold text-primary-700 ${compact ? "text-base" : "text-xl"}`}>
            {formatIDR(product.price)}
          </span>

          {isOwned ? (
            <Link
              href={`/my-learning`}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            >
              Akses
            </Link>
          ) : (
            <Link
              href={`/products/${product.slug}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              Beli Sekarang
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
