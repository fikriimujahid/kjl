'use client';

import ImageViewer from '@/components/course/ImageViewer';
import type { Session } from '@/types/product';
import { SessionTypeIcon } from './SessionTypeIcon';

interface CourseSessionContentProps {
  activeSession: Session | null;
  activeImagePages: string[];
  isLoadingProduct: boolean;
  onCloseSession: () => void;
}

export function CourseSessionContent({
  activeSession,
  activeImagePages,
  isLoadingProduct,
  onCloseSession,
}: CourseSessionContentProps) {
  if (activeSession) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mt-4 tracking-tight">{activeSession.title}</h2>
          </div>
          <button
            onClick={onCloseSession}
            className="text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tutup Materi
          </button>
        </div>

        <div className="min-h-[400px]">
          {activeSession.type === 'images' ? (
            <ImageViewer title={activeSession.title} images={activeImagePages} />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex items-center justify-center text-slate-500 font-medium">
              Konten untuk tipe sesi ini akan segera tersedia.
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isLoadingProduct) {
    return (
      <div className="animate-pulse bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] p-8 space-y-5">
        <div className="h-7 w-1/3 bg-slate-200 rounded-full" />
        <div className="h-4 w-full bg-slate-100 rounded-full" />
        <div className="h-4 w-5/6 bg-slate-100 rounded-full" />
        <div className="h-4 w-3/4 bg-slate-100 rounded-full" />
        <div className="mt-6 h-56 w-full bg-slate-100 rounded-2xl" />
        <div className="h-4 w-2/3 bg-slate-100 rounded-full" />
        <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-slate-200 min-h-[600px] flex flex-col items-center justify-center text-center p-12">
      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-8 text-slate-300">
        <SessionTypeIcon type="exam" />
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-4 tracking-tight">Siap Mulai Belajar?</h2>
      <p className="text-slate-400 max-w-sm font-medium text-sm leading-relaxed">Pilih sebuah sesi dari kurikulum di sebelah kiri untuk menampilkan materi, kuis, atau audio pembelajaran.</p>
    </div>
  );
}
