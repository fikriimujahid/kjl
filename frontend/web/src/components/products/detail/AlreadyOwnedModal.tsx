'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, X } from 'lucide-react';

interface AlreadyOwnedModalProps {
  productId: string;
  onClose: () => void;
}

export default function AlreadyOwnedModal({ productId, onClose }: AlreadyOwnedModalProps) {
  const router = useRouter();

  const handleGoToCourse = () => {
    onClose();
    router.push(`/course?productId=${encodeURIComponent(productId)}`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Tutup"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100">
              <CheckCircle size={32} className="text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Kamu Sudah Memiliki Produk Ini</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Kamu sudah membeli produk ini sebelumnya. Yuk, langsung mulai belajar!
              </p>
            </div>
            <button
              onClick={handleGoToCourse}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors mt-2"
            >
              Mulai Belajar
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 px-6 text-slate-500 hover:text-slate-700 font-semibold text-sm transition-colors"
            >
              Kembali
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}