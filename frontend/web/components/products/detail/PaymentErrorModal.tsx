'use client';

import { motion, AnimatePresence } from 'motion/react';
import { XCircle, X } from 'lucide-react';

interface PaymentErrorModalProps {
  message: string;
  onClose: () => void;
}

export function PaymentErrorModal({ message, onClose }: PaymentErrorModalProps) {
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
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <XCircle size={32} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Pembayaran Gagal</h2>
              <p className="text-slate-500 text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl transition-colors mt-2"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
