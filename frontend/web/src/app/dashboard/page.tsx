"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { mockProducts, mockTopics, mockSessions } from "@/lib/mock-data";
import SummaryCard from "@/components/dashboard/SummaryCard";
import Loader from "@/components/ui/Loader";

export default function DashboardPage() {
  const { user, isLoggedIn, isLoading, ownedProductIds } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading) return <Loader message="Memuat dashboard..." />;
  if (!user) return null;

  const ownedProducts = mockProducts.filter((p) => ownedProductIds.includes(p.id));

  // Last accessed: first session from first owned product's first topic
  const firstProduct = ownedProducts[0];
  const firstTopic = firstProduct ? mockTopics.find((t) => t.productId === firstProduct.id) : null;
  const firstSession = firstTopic ? mockSessions.find((s) => s.topicId === firstTopic.id) : null;

  const firstName = user.displayName.split(" ")[0];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Selamat Datang, <span className="text-primary-600">{firstName}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Lanjutkan belajarmu hari ini dan raih target ujianmu.
          </p>
        </div>
        <Link
          href="/products"
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        >
          Cari Produk
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard
          label="Produk Dimiliki"
          value={ownedProductIds.length}
          accent
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
        />
        <SummaryCard
          label="Total Soal Tersedia"
          value={ownedProducts.reduce((acc, p) => acc + p.questionsCount, 0)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <SummaryCard
          label="Sesi Tersedia"
          value={mockSessions.filter((s) => ownedProductIds.includes(s.productId)).length}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Recent learning */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Belajar Terakhir</h2>
        {firstProduct && firstTopic && firstSession ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{firstProduct.name}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {firstTopic.name} · {firstSession.name}
                  </p>
                  <span className="inline-block mt-2 text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 font-medium">
                    {firstSession.questionCount} soal
                  </span>
                </div>
              </div>
              <Link
                href={`/my-learning/${firstProduct.id}/${firstTopic.id}/${firstSession.id}`}
                className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 whitespace-nowrap"
              >
                Lanjutkan →
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500 text-sm">Kamu belum memiliki produk. Mulai belajar dengan membeli paket!</p>
            <Link href="/products" className="inline-block mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700">
              Lihat Produk →
            </Link>
          </div>
        )}
      </div>

      {/* Owned products quick list */}
      {ownedProducts.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Produkku</h2>
            <Link href="/my-learning" className="text-sm text-primary-600 font-semibold hover:text-primary-700">
              Lihat semua →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ownedProducts.map((product) => {
              const topicCount = mockTopics.filter((t) => t.productId === product.id).length;
              return (
                <Link
                  key={product.id}
                  href="/my-learning"
                  className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4 hover:border-primary-300 hover:shadow-sm transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{topicCount} topik · {product.questionsCount} soal</p>
                  </div>
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
