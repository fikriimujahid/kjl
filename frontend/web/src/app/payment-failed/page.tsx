import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pembayaran Gagal" };

export default function PaymentFailedPage() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-md w-full flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pembayaran Gagal</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Maaf, pembayaranmu tidak berhasil diproses. Tidak ada dana yang dikenakan. Silakan coba lagi atau hubungi kami jika masalah berlanjut.
          </p>
        </div>

        {/* Possible reasons */}
        <div className="w-full bg-red-50 rounded-xl px-5 py-4 text-left">
          <p className="text-xs font-semibold text-red-700 mb-2">Kemungkinan penyebab:</p>
          <ul className="text-xs text-red-600 space-y-1 list-disc list-inside">
            <li>Saldo tidak mencukupi</li>
            <li>Kartu ditolak oleh bank</li>
            <li>Batas waktu pembayaran habis</li>
            <li>Masalah koneksi saat transaksi</li>
          </ul>
        </div>

        {/* CTA */}
        <Link
          href="/products"
          className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-center"
        >
          Coba Lagi
        </Link>
        <a
          href="mailto:support@kejepangdulu.com"
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          Hubungi Dukungan
        </a>
      </div>
    </div>
  );
}
