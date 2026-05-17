import Link from 'next/link';

export function FaqPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-xl space-y-6">
        <span className="inline-flex items-center rounded-full bg-indigo-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-indigo-700">
          Segera Hadir
        </span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Halaman FAQ Sedang Disiapkan</h1>
        <p className="text-lg font-medium text-slate-500">
          Tim sedang merapikan materi bantuan dan pertanyaan yang paling sering diajukan.
        </p>
        <Link href="/products" className="inline-flex items-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">
          Kembali ke Produk
        </Link>
      </div>
    </div>
  );
}
