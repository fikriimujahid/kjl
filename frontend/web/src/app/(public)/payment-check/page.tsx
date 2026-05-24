'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCcw,
} from 'lucide-react';
import { motion } from 'motion/react';

// ─── Midtrans transaction_status values ────────────────────────────────────
// Reference: https://docs.midtrans.com/reference/transaction-status
type ResultType = 'success' | 'pending' | 'failed' | 'unknown';

function resolveResultType(
  transactionStatus: string | null,
  statusCode: string | null,
): ResultType {
  if (!transactionStatus) {
    // Fall back to status_code alone
    if (statusCode === '200') return 'success';
    if (statusCode === '201') return 'pending';
    if (statusCode === '202') return 'failed';
    return 'unknown';
  }

  switch (transactionStatus) {
    // ── Successful ──────────────────────────────────────────────────────────
    case 'capture':      // card payment captured, safe to fulfil
    case 'settlement':   // funds settled to account
      return 'success';

    // ── Pending ─────────────────────────────────────────────────────────────
    case 'pending':      // awaiting payment (bank transfer, e-wallet, OTC, etc.)
    case 'authorize':    // card pre-auth; not yet captured (rare on redirect)
      return 'pending';

    // ── Failed ──────────────────────────────────────────────────────────────
    case 'deny':         // rejected by payment provider / FDS
    case 'cancel':       // cancelled by merchant or bank
    case 'expire':       // payment window expired
    case 'failure':      // unexpected processing error
      return 'failed';

    default:
      return 'unknown';
  }
}

// ─── UI config per result type ───────────────────────────────────────────────
const CONFIG = {
  success: {
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    Icon: CheckCircle2,
    title: 'Pembayaran Berhasil!',
    message:
      'Transaksi kamu telah berhasil diproses. Produk kini sudah tersedia di dashboard pembelajaran.',
    primaryLabel: 'Mulai Belajar',
    primaryHref: '/dashboard',
    primaryIcon: ArrowRight,
    secondaryLabel: 'Kembali ke Dashboard',
    secondaryHref: '/dashboard',
  },
  pending: {
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    Icon: Clock,
    title: 'Menunggu Pembayaran',
    message:
      'Pesanan kamu sudah terdaftar. Selesaikan pembayaran sesuai instruksi yang telah dikirimkan. Akses akan aktif setelah pembayaran dikonfirmasi.',
    primaryLabel: 'Lihat Pesanan',
    primaryHref: '/dashboard',
    primaryIcon: ArrowRight,
    secondaryLabel: 'Kembali ke Beranda',
    secondaryHref: '/',
  },
  failed: {
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    Icon: XCircle,
    title: 'Pembayaran Gagal',
    message:
      'Transaksi kamu tidak berhasil diproses. Silakan coba lagi atau gunakan metode pembayaran lain.',
    primaryLabel: 'Coba Lagi',
    primaryHref: '/products',
    primaryIcon: RefreshCcw,
    secondaryLabel: 'Hubungi Bantuan',
    secondaryHref: '/faq',
  },
  unknown: {
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-400',
    Icon: AlertTriangle,
    title: 'Status Tidak Diketahui',
    message:
      'Kami tidak dapat menentukan status pembayaran kamu saat ini. Jika dana sudah terpotong, hubungi tim bantuan kami.',
    primaryLabel: 'Hubungi Bantuan',
    primaryHref: '/faq',
    primaryIcon: ArrowRight,
    secondaryLabel: 'Kembali ke Beranda',
    secondaryHref: '/',
  },
} as const;

// ─── Inner component (uses useSearchParams) ──────────────────────────────────
function PaymentCheckContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('order_id');
  const statusCode = searchParams.get('status_code');
  const transactionStatus = searchParams.get('transaction_status');

  const resultType = resolveResultType(transactionStatus, statusCode);
  const cfg = CONFIG[resultType];
  const { Icon, primaryIcon: PrimaryIcon } = cfg;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-12 rounded-[3.5rem] shadow-2xl border border-gray-100 flex flex-col items-center"
      >
        {/* Icon */}
        <div
          className={`w-24 h-24 ${cfg.iconBg} ${cfg.iconColor} rounded-full flex items-center justify-center mb-10 shadow-inner`}
        >
          <Icon size={56} strokeWidth={3} />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">
          {cfg.title}
        </h1>

        {/* Message */}
        <p className="text-gray-500 font-medium leading-relaxed mb-6">
          {cfg.message}
        </p>

        {/* Order ID badge */}
        {orderId && (
          <div className="mb-8 px-4 py-2 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-400 font-mono tracking-wide">
            Order: <span className="text-gray-600 font-semibold">{orderId}</span>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-4 w-full">
          <Link
            href={cfg.primaryHref}
            className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all"
          >
            {cfg.primaryLabel}
            <PrimaryIcon size={24} />
          </Link>
          <Link
            href={cfg.secondaryHref}
            className="w-full py-4 text-gray-400 font-bold hover:text-indigo-600 transition-colors"
          >
            {cfg.secondaryLabel}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Page export (Suspense boundary required for useSearchParams in static export)
export default function PaymentCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <PaymentCheckContent />
    </Suspense>
  );
}
