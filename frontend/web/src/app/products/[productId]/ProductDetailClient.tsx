"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { formatIDR } from "@/lib/mock-data";
import type { Product } from "@/lib/types";

export default function ProductDetailClient({ product }: { product: Product }) {
  const { isLoggedIn, ownedProductIds } = useAuth();
  const router = useRouter();
  const isOwned = ownedProductIds.includes(product.id);

  function handleBuy() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    // In real app: call POST /payment/create
    router.push("/payment-success");
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col gap-5">
      {/* Price */}
      <div>
        <p className="text-sm text-gray-500 mb-1">Harga</p>
        <p className="text-3xl font-extrabold text-primary-700">{formatIDR(product.price)}</p>
        <p className="text-xs text-gray-400 mt-0.5">Bayar sekali, akses seumur hidup</p>
      </div>

      {/* What's included */}
      <div className="flex flex-col gap-2.5">
        {[
          `${product.topicsCount} topik belajar`,
          `${product.questionsCount} soal latihan`,
          "Akses seumur hidup",
          "Konten diperbarui secara berkala",
        ].map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            {item}
          </div>
        ))}
      </div>

      {/* CTA */}
      {isOwned ? (
        <Link
          href="/my-learning"
          className="w-full py-3.5 rounded-xl bg-green-600 text-white font-semibold text-center hover:bg-green-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        >
          ✓ Akses Materi
        </Link>
      ) : (
        <button
          onClick={handleBuy}
          className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Beli Sekarang
        </button>
      )}

      {!isLoggedIn && (
        <p className="text-xs text-gray-400 text-center">
          Kamu perlu{" "}
          <Link href="/login" className="text-primary-500 underline">masuk</Link>{" "}
          untuk membeli.
        </p>
      )}

      {/* Trust badges */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
        {[
          { icon: "🔒", text: "Pembayaran aman via Midtrans" },
          { icon: "⚡", text: "Akses instan setelah pembayaran" },
        ].map((b) => (
          <p key={b.text} className="text-xs text-gray-500 flex items-center gap-2">
            <span>{b.icon}</span> {b.text}
          </p>
        ))}
      </div>
    </div>
  );
}
