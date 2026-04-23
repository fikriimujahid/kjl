import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Pembayaran Berhasil" };

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-[calc(100dvh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-md w-full flex flex-col items-center text-center gap-5">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pembayaran Berhasil!</h1>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Transaksimu sudah dikonfirmasi. Produk telah ditambahkan ke akun kamu dan siap untuk dipelajari.
          </p>
        </div>

        {/* Order info mock */}
        <div className="w-full bg-green-50 rounded-xl px-5 py-4 flex flex-col gap-1.5 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>Status</span>
            <span className="font-semibold text-green-700">Berhasil</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Metode</span>
            <span className="font-semibold">Transfer Bank</span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Waktu</span>
            <span className="font-semibold">
              {new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/my-learning"
          className="w-full py-3.5 rounded-xl bg-primary-600 text-white font-semibold text-sm hover:bg-primary-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 text-center"
        >
          Mulai Belajar Sekarang →
        </Link>
        <Link
          href="/products"
          className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
        >
          Lihat produk lainnya
        </Link>
      </div>
    </div>
  );
}
