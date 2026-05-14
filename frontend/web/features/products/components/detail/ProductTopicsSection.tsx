import { ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { ProductDetail } from '../../types';
import { getSessionTypeLabel } from '../../utils/product.utils';
import { SessionTypeIcon } from './SessionTypeIcon';

interface ProductTopicsSectionProps {
  topics: ProductDetail['topics'];
  totalSessions: number;
  openTopicId: string | null;
  onToggleTopic: (topicId: string) => void;
}

export function ProductTopicsSection({
  topics,
  totalSessions,
  openTopicId,
  onToggleTopic,
}: ProductTopicsSectionProps) {
  if (topics.length === 0) {
    return null;
  }

  return (
    <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-gray-900">Daftar Topik</h2>
        <span className="text-sm text-gray-400 font-bold">
          {topics.length} topik · {totalSessions} sesi
        </span>
      </div>

      <div className="space-y-3">
        {topics.map((topic, index) => (
          <div key={topic.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => onToggleTopic(topic.id)} className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-sm shrink-0">{index + 1}</span>
              <span className="flex-1 font-bold text-gray-800">{topic.title}</span>
              <span className="text-xs text-gray-400 font-medium mr-2">{topic.sessions.length} sesi</span>
              <ChevronDown size={18} className={`text-gray-400 transition-transform duration-200 ${openTopicId === topic.id ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence initial={false}>
              {openTopicId === topic.id && (
                <motion.div key="content" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} transition={{ duration: 0.2, ease: 'easeInOut' }} className="overflow-hidden">
                  <div className="border-t border-gray-100 px-5 py-3 space-y-1">
                    {topic.sessions.map((session) => (
                      <div key={session.id} className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <SessionTypeIcon type={session.type} />
                        </div>
                        <span className="flex-1 text-sm text-gray-700 font-medium">{session.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">{getSessionTypeLabel(session.type)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </motion.section>
  );
}