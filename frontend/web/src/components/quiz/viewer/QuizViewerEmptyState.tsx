'use client';

export function QuizViewerEmptyState() {
  return (
    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-3 tracking-tight">Kuis Belum Tersedia</h2>
      <p className="text-slate-500 font-medium">Data pertanyaan untuk sesi ini belum bisa dimuat.</p>
    </div>
  );
}
