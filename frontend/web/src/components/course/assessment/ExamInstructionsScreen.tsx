'use client';

import {
  AlertCircle,
  BarChart2,
  Bookmark,
  CheckSquare,
  FileText,
  MessageCircle,
  Pause,
  PlayCircle,
  RefreshCcw,
} from 'lucide-react';
import { cn } from '@/utils/classnames';
import type { ExamInstructionsScreenProps } from '../../../types/assessment';

export function ExamInstructionsScreen({
  sessionTitle,
  totalQuestions,
  onBegin,
  onBack,
  durationMinutes = 130,
  passingScorePercent = 72,
  passingScorePoints = 720,
}: ExamInstructionsScreenProps) {
  const hours = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours} jam${mins > 0 ? ` ${mins} menit` : ''}` : `${mins} menit`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-rose-600 to-orange-500 px-8 py-7 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/15 rounded-full mb-4">
              <FileText size={28} className="text-white" />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight leading-snug">
              Simulasi Ujian
            </h1>
            <p className="text-rose-100 text-sm font-medium mt-1 line-clamp-2">{sessionTitle}</p>
          </div>

          <div className="px-8 pt-6 pb-0">
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-sm font-semibold rounded-xl px-4 py-3">
              <CheckSquare size={16} className="shrink-0" />
              Ujian latihan berhasil diselesaikan.
            </div>
          </div>

          <div className="px-8 pt-5 pb-0">
            <p className="text-slate-700 font-semibold text-sm">
              {totalQuestions} soal · {durationLabel} · {passingScorePercent}% jawaban benar diperlukan untuk lulus
            </p>
          </div>

          <div className="px-8 pt-5 pb-2">
            <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest mb-3">
              Tentang ujian latihan ini:
            </h2>
            <ul className="space-y-2">
              {[
                'Urutan soal dan urutan pilihan jawaban diacak setiap percobaan.',
                'Kamu hanya dapat meninjau jawaban setelah menyelesaikan ujian.',
                `Terdiri dari ${totalQuestions} soal, durasi ${durationMinutes} menit, passing score ${passingScorePoints}.`,
              ].map((text, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="px-8 pt-4 pb-2">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0" />
                <h3 className="text-amber-700 font-bold text-sm">Jika ada masalah dengan soal:</h3>
              </div>
              <ul className="space-y-1.5 pl-1">
                {[
                  { icon: MessageCircle, text: 'Ajukan pertanyaan di kolom Q&A.' },
                  { icon: FileText, text: 'Ambil screenshot soal tersebut (karena urutan diacak) dan lampirkan.' },
                  { icon: CheckSquare, text: 'Kami akan segera merespons dan memperbaiki masalahnya.' },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <li key={idx} className="flex items-start gap-2 text-amber-700 text-xs leading-relaxed">
                      <Icon size={13} className="shrink-0 mt-0.5" />
                      {item.text}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className="px-8 pt-3 pb-2">
            <p className="text-slate-600 text-sm font-semibold text-center">Semoga sukses, dan selamat belajar!</p>
          </div>

          <div className="px-8 py-4">
            <h2 className="text-slate-800 font-bold text-sm uppercase tracking-widest mb-4">Petunjuk:</h2>
            <ul className="space-y-3">
              {[
                {
                  icon: Pause,
                  text: 'Kamu dapat menjeda ujian kapan saja dan melanjutkannya nanti.',
                },
                {
                  icon: RefreshCcw,
                  text: 'Kamu dapat mengulang ujian sebanyak yang kamu inginkan.',
                },
                {
                  icon: BarChart2,
                  text: 'Progress bar di bagian atas layar akan menampilkan progresmu beserta sisa waktu. Jika waktu habis, jangan khawatir, kamu masih bisa menyelesaikan ujian.',
                },
                {
                  icon: Bookmark,
                  text: 'Kamu dapat mengklik ikon bookmark untuk menandai soal untuk ditinjau, atau klik "lewati soal" untuk melewatinya.',
                },
                {
                  icon: CheckSquare,
                  text: 'Klik "Selesaikan Ujian" untuk mengakhiri ujian dan melihat hasilmu segera.',
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm leading-relaxed">
                    <Icon size={16} className={cn('shrink-0 mt-0.5', 'text-rose-500')} />
                    <span>{item.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
            >
              ← Kembali ke Hasil
            </button>
            <button
              onClick={onBegin}
              className="flex items-center gap-2 px-8 py-3 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.97] bg-rose-600 hover:bg-rose-700"
            >
              <PlayCircle size={18} />
              Mulai Ujian
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
