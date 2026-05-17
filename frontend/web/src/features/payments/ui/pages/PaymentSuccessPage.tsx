'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function PaymentSuccessPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mb-10 shadow-inner">
          <CheckCircle2 size={56} strokeWidth={3} />
        </div>
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Pembayaran Berhasil!</h1>
        <p className="text-gray-500 font-medium leading-relaxed mb-10">
          Selamat! Transaksi kamu telah diproses. Produk kini sudah tersedia di dashboard pembelajaran.
        </p>

        <div className="space-y-4 w-full">
          <Link href="/my-learning" className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all">
            Mulai Belajar
            <ArrowRight size={24} />
          </Link>
          <Link href="/dashboard" className="w-full py-4 text-gray-400 font-bold hover:text-indigo-600 transition-colors">
            Kembali ke Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
