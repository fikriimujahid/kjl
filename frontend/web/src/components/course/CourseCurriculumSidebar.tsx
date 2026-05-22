'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { ProductDetail, Session } from '@/types/product';
import { SessionTypeIcon } from './SessionTypeIcon';

interface CourseCurriculumSidebarProps {
  selectedProduct: ProductDetail | null;
  isLoadingProduct: boolean;
  productError: string | null;
  loadingSessionId: string | null;
  activeSessionId: string | null;
  onSessionClick: (topicId: string, session: Session) => void;
}

export function CourseCurriculumSidebar({
  selectedProduct,
  isLoadingProduct,
  productError,
  loadingSessionId,
  activeSessionId,
  onSessionClick,
}: CourseCurriculumSidebarProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const handleToggleTopic = (topicId: string) => {
    setExpandedTopic((currentTopicId) => (currentTopicId === topicId ? null : topicId));
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 bg-slate-50/50 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 tracking-tight text-sm">Kurikulum Belajar {selectedProduct ? `${selectedProduct.name}` : ''}</h3>
      </div>

      <div className="divide-y divide-slate-50">
        {isLoadingProduct && (
          <div className="p-4 space-y-2 animate-pulse">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-10 bg-slate-100 rounded-xl" />
            ))}
          </div>
        )}

        {!isLoadingProduct && !productError && !selectedProduct && (
          <div className="p-5 text-xs font-semibold text-slate-500">Produk tidak ditemukan.</div>
        )}

        {!isLoadingProduct && productError && (
          <div className="p-5 text-xs font-semibold text-rose-500">{productError}</div>
        )}

        {!isLoadingProduct && !productError && selectedProduct && selectedProduct.topics.length === 0 && (
          <div className="p-5 text-xs font-semibold text-slate-500">Kurikulum sesi akan dipublikasikan pada update berikutnya.</div>
        )}

        {!isLoadingProduct && !productError && selectedProduct && selectedProduct.topics.length > 0 && selectedProduct.topics.map((topic) => (
          <div key={topic.id} className="overflow-hidden">
            <button
              onClick={() => handleToggleTopic(topic.id)}
              className="w-full p-5 flex justify-between items-center bg-white hover:bg-slate-50 transition-colors text-left"
            >
              <span className="font-bold text-slate-800 text-xs leading-tight pr-4">{topic.title}</span>
              {expandedTopic === topic.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            <AnimatePresence>
              {expandedTopic === topic.id && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-slate-50/50">
                  <div className="px-3 pb-4 space-y-1">
                    {topic.sessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => onSessionClick(topic.id, session)}
                        disabled={loadingSessionId !== null}
                        className={cn(
                          'w-full p-3 rounded-lg flex items-center gap-4 transition-all text-left disabled:opacity-70 disabled:cursor-wait',
                          activeSessionId === session.id
                            ? 'bg-white shadow-sm ring-1 ring-slate-100 text-indigo-600'
                            : 'text-slate-600 hover:bg-white/50',
                        )}
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-slate-100',
                          activeSessionId === session.id ? 'bg-indigo-50' : 'bg-white',
                        )}>
                          <SessionTypeIcon type={session.type} />
                        </div>

                        <span className="font-bold text-xs leading-tight">
                          {loadingSessionId === session.id ? 'Memuat sesi...' : session.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
