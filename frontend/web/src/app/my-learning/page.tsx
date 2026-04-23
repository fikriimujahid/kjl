"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockProducts, mockTopics } from "@/lib/mock-data";
import TopicList from "@/components/learning/TopicList";
import EmptyState from "@/components/ui/EmptyState";
import Loader from "@/components/ui/Loader";

export default function MyLearningPage() {
  const { isLoggedIn, isLoading, ownedProductIds } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) return <Loader message="Memuat konten belajarmu..." />;
  if (!isLoggedIn) return null;

  const ownedProducts = mockProducts.filter((p) => ownedProductIds.includes(p.id));

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Belajarku</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {ownedProducts.length} produk · Klik topik untuk melihat sesi belajar
        </p>
      </div>

      {ownedProducts.length === 0 ? (
        <EmptyState
          title="Kamu belum memiliki produk"
          description="Beli paket belajar untuk mulai mengakses materi dan latihan soal."
          action={
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
            >
              Lihat Produk
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-10">
          {ownedProducts.map((product) => {
            const topics = mockTopics.filter((t) => t.productId === product.id);
            return (
              <section key={product.id}>
                {/* Product header */}
                <div className="flex items-start justify-between mb-4 gap-4">
                  <div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium">
                      {product.category}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-1">{product.name}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">{topics.length} topik tersedia</p>
                  </div>
                </div>

                <TopicList topics={topics} productId={product.id} />
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
