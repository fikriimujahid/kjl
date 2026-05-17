'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/shared/utils';

interface ImageViewerProps {
  images: string[];
  title?: string;
}

export default function ImageViewer({ images, title }: ImageViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] flex flex-col items-center justify-center text-center p-10">
        <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-6 border border-slate-200">
          <ImageIcon size={36} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">Gambar Belum Tersedia</h3>
        <p className="text-slate-500 text-sm font-medium max-w-md">Mock API untuk sesi gambar berhasil dipanggil, tetapi tidak ada halaman gambar yang dikembalikan.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider">Learning Mode</span>
          <h2 className="font-bold text-slate-800 text-sm truncate">{title ?? 'Sesi Gambar'}</h2>
        </div>
        <div className="text-xs text-slate-500 font-medium shrink-0">
          Halaman <span className="text-emerald-700">{currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}</span> dari {images.length}
        </div>
      </div>

      <div>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl"
        >
          <img
            src={images[currentIndex]}
            alt={`Materi gambar halaman ${currentIndex + 1}`}
            className="w-full max-h-[620px] object-contain border border-slate-200 shadow-sm bg-white"
          />
        </motion.div>
      </div>

      <div className="p-6 border-t border-slate-100 flex items-center justify-between gap-4">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((value) => value - 1)}
          className="px-6 py-2 border border-slate-200 rounded-lg font-bold text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Sebelumnya
        </button>

        <div className="hidden sm:flex gap-2">
          {images.map((_, index) => (
            <button
              key={`image-page-${index}`}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                'w-8 h-8 rounded text-[10px] font-bold transition-colors',
                currentIndex === index ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              )}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button
          disabled={currentIndex === images.length - 1}
          onClick={() => setCurrentIndex((value) => value + 1)}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 flex items-center gap-2 shadow-sm shadow-emerald-100 transition-all disabled:opacity-50"
        >
          Selanjutnya
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
