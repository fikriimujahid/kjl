import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="max-w-xl space-y-6">
        <span className="inline-flex items-center rounded-full bg-amber-100 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-amber-700">
          Belum Aktif
        </span>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Reset Password Akan Ditambahkan Saat Auth Nyata Siap</h1>
        <p className="text-lg font-medium text-slate-500">
          Untuk saat ini alur login masih berupa mock flow. Halaman ini disediakan agar navigasi tidak berujung ke route yang hilang.
        </p>
        <Link href="/login" className="inline-flex items-center rounded-2xl bg-indigo-600 px-8 py-4 text-sm font-black text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700">
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
}