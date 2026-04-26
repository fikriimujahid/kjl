export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 text-center">
      <div className="space-y-8">
        <div className="text-[12rem] font-black text-indigo-50/50 leading-none select-none">404</div>
        <div className="space-y-2 -mt-20">
          <h1 className="text-4xl font-black text-gray-900">Halaman Tidak Ditemukan</h1>
          <p className="text-gray-500 text-lg font-medium">Ups! Sepertinya kamu tersesat di tengah latihan kanji.</p>
        </div>
        <a href="/" className="inline-block px-10 py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100">
          Balik ke Beranda
        </a>
      </div>
    </div>
  );
}