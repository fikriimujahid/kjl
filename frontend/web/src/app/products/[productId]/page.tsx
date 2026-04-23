import { notFound } from "next/navigation";
import Link from "next/link";
import { mockProducts, mockTopics, mockSessions } from "@/lib/mock-data";
import ProductDetailClient from "./ProductDetailClient";

interface PageProps {
  params: Promise<{ productId: string }>;
}

export function generateStaticParams() {
  return mockProducts.map((p) => ({ productId: p.slug }));
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { productId } = await params;

  const product = mockProducts.find((p) => p.slug === productId);
  if (!product) notFound();

  const topics = mockTopics.filter((t) => t.productId === product.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-primary-600 transition-colors">Produk</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-800 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left — details */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            {product.badge && (
              <span className="inline-block mb-3 px-3 py-1 rounded-full text-xs font-semibold bg-accent-100 text-accent-600">
                {product.badge}
              </span>
            )}
            <span className="inline-block mb-3 ml-2 px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-600">
              {product.category}
            </span>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">{product.name}</h1>
            <p className="text-gray-600 leading-relaxed text-sm mb-4">{product.description}</p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {product.topicsCount} topik
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {product.questionsCount} soal latihan
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Akses seumur hidup
              </span>
            </div>
          </div>

          {/* Topics list */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Daftar Topik</h2>
            <div className="flex flex-col gap-3">
              {topics.map((topic, idx) => {
                const sessions = mockSessions.filter((s) => s.topicId === topic.id);
                return (
                  <div key={topic.id} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{topic.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{sessions.length} sesi</p>
                      {sessions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {sessions.slice(0, 4).map((s) => (
                            <span key={s.id} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                              {s.name}
                            </span>
                          ))}
                          {sessions.length > 4 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                              +{sessions.length - 4} lagi
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — purchase card */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProductDetailClient product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
