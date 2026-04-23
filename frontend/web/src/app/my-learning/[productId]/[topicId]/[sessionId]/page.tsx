import { notFound } from "next/navigation";
import Link from "next/link";
import { mockProducts, mockTopics, mockSessions, mockQuizData } from "@/lib/mock-data";
import QuizViewer from "@/components/learning/QuizViewer";

interface PageProps {
  params: {
    productId: string;
    topicId: string;
    sessionId: string;
  };
}

export function generateStaticParams() {
  return mockSessions.map((session) => ({
    productId: session.productId,
    topicId: session.topicId,
    sessionId: session.id,
  }));
}

export default function LearningSessionPage({ params }: PageProps) {
  const product = mockProducts.find((p) => p.id === params.productId);
  const topic = mockTopics.find((t) => t.id === params.topicId);
  const session = mockSessions.find((s) => s.id === params.sessionId);

  if (!product || !topic || !session) notFound();

  // Use the shared mock quiz data (in production: fetch from signed URL)
  const quiz = {
    ...mockQuizData,
    productId: product.id,
    topicSlug: topic.slug,
    sessionSlug: session.slug,
    questions: mockQuizData.questions.slice(
      0,
      Math.min(session.questionCount, mockQuizData.questions.length)
    ),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back navigation */}
      <Link
        href="/my-learning"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Belajarku
      </Link>

      {/* Session header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-5 text-white mb-6">
        <p className="text-primary-200 text-xs font-medium mb-1 uppercase tracking-wide">
          {product.name} · {topic.name}
        </p>
        <h1 className="text-xl font-bold">{session.name}</h1>
        <p className="text-primary-200 text-sm mt-1">{session.questionCount} soal pilihan ganda</p>
      </div>

      {/* Quiz viewer */}
      <QuizViewer quiz={quiz} />
    </div>
  );
}
