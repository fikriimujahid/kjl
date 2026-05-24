import type { AssessmentMode } from '../../../types/assessment';

export interface AssessmentHistoryConfig {
  badgeLabel: string;
  badgeTextClass: string;
  headerGradientClass: string;
  averageIconBgClass: string;
  averageIconColorClass: string;
  passedLabel: string;
  loadingText: string;
  emptyText: string;
  activeSummaryText: string;
  startButtonClass: string;
  startButtonActiveLabel: string;
  startButtonIdleLabel: string;
}

export type AssessmentInstructionIconKey =
  | 'checkSquare'
  | 'coffee'
  | 'refresh'
  | 'chart'
  | 'pause'
  | 'bookmark'
  | 'message'
  | 'file';

export interface AssessmentInstructionItem {
  icon: AssessmentInstructionIconKey;
  text: string;
}

export interface AssessmentIssueItem {
  icon: AssessmentInstructionIconKey;
  text: string;
}

export interface AssessmentInstructionsConfig {
  titlePrefix: string;
  headerGradientClass: string;
  headerTextClass: string;
  beginButtonClass: string;
  beginButtonLabel: string;
  submittedText: string;
  instructions: AssessmentInstructionItem[];
  aboutTitle?: string;
  aboutItems?: (context: {
    totalQuestions: number;
    durationMinutes: number;
    passingScorePoints: number;
  }) => string[];
  issueTitle?: string;
  issueItems?: AssessmentIssueItem[];
  closingText?: string;
}

export const ASSESSMENT_HISTORY_CONFIG: Record<AssessmentMode, AssessmentHistoryConfig> = {
  practice: {
    badgeLabel: 'Latihan Soal',
    badgeTextClass: 'text-violet-200',
    headerGradientClass: 'from-violet-600 to-indigo-600',
    averageIconBgClass: 'bg-indigo-50',
    averageIconColorClass: 'text-indigo-500',
    passedLabel: 'Latihan Lulus',
    loadingText: 'Memuat riwayat latihan...',
    emptyText: 'Belum ada riwayat latihan untuk sesi ini.',
    activeSummaryText: 'Ada latihan yang masih aktif',
    startButtonClass: 'bg-violet-600 hover:bg-violet-700',
    startButtonActiveLabel: 'Lanjutkan Latihan',
    startButtonIdleLabel: 'Mulai/Ulangi Latihan',
  },
  exam: {
    badgeLabel: 'Simulasi Ujian',
    badgeTextClass: 'text-rose-200',
    headerGradientClass: 'from-rose-600 to-orange-500',
    averageIconBgClass: 'bg-rose-50',
    averageIconColorClass: 'text-rose-500',
    passedLabel: 'Ujian Lulus',
    loadingText: 'Memuat riwayat ujian...',
    emptyText: 'Belum ada riwayat ujian untuk sesi ini.',
    activeSummaryText: 'Ada ujian yang masih aktif',
    startButtonClass: 'bg-rose-600 hover:bg-rose-700',
    startButtonActiveLabel: 'Lanjutkan Ujian',
    startButtonIdleLabel: 'Mulai/Ulangi Ujian',
  },
};

export const ASSESSMENT_INSTRUCTIONS_CONFIG: Record<AssessmentMode, AssessmentInstructionsConfig> = {
  practice: {
    titlePrefix: 'Latihan Soal',
    headerGradientClass: 'from-violet-600 to-indigo-600',
    headerTextClass: 'text-violet-200',
    beginButtonClass: 'bg-violet-600 hover:bg-violet-700',
    beginButtonLabel: 'Mulai Latihan',
    submittedText: 'Latihan soal berhasil diselesaikan.',
    instructions: [
      {
        icon: 'checkSquare',
        text: 'Kamu dapat mengklik "Periksa Jawaban" untuk mendapatkan umpan balik langsung beserta penjelasan jawabannya.',
      },
      {
        icon: 'coffee',
        text: 'Kamu dapat beristirahat kapan saja dan melanjutkan latihan nanti.',
      },
      {
        icon: 'refresh',
        text: 'Kamu dapat mengulang latihan sebanyak yang kamu inginkan.',
      },
      {
        icon: 'chart',
        text: 'Progress bar di bagian atas layar akan menampilkan progresmu. Jika ingin menyelesaikan latihan dan melihat hasil segera, klik tombol "Selesaikan Latihan".',
      },
    ],
  },
  exam: {
    titlePrefix: 'Simulasi Ujian',
    headerGradientClass: 'from-rose-600 to-orange-500',
    headerTextClass: 'text-rose-100',
    beginButtonClass: 'bg-rose-600 hover:bg-rose-700',
    beginButtonLabel: 'Mulai Ujian',
    submittedText: 'Ujian latihan berhasil diselesaikan.',
    aboutTitle: 'Tentang ujian latihan ini:',
    aboutItems: ({ totalQuestions, durationMinutes, passingScorePoints }) => [
      'Urutan soal dan urutan pilihan jawaban diacak setiap percobaan.',
      'Kamu hanya dapat meninjau jawaban setelah menyelesaikan ujian.',
      `Terdiri dari ${totalQuestions} soal, durasi ${durationMinutes} menit, passing score ${passingScorePoints}.`,
    ],
    issueTitle: 'Jika ada masalah dengan soal:',
    issueItems: [
      { icon: 'message', text: 'Ajukan pertanyaan di kolom Q&A.' },
      { icon: 'file', text: 'Ambil screenshot soal tersebut (karena urutan diacak) dan lampirkan.' },
      { icon: 'checkSquare', text: 'Kami akan segera merespons dan memperbaiki masalahnya.' },
    ],
    closingText: 'Semoga sukses, dan selamat belajar!',
    instructions: [
      {
        icon: 'pause',
        text: 'Kamu dapat menjeda ujian kapan saja dan melanjutkannya nanti.',
      },
      {
        icon: 'refresh',
        text: 'Kamu dapat mengulang ujian sebanyak yang kamu inginkan.',
      },
      {
        icon: 'chart',
        text: 'Progress bar di bagian atas layar akan menampilkan progresmu beserta sisa waktu. Jika waktu habis, jangan khawatir, kamu masih bisa menyelesaikan ujian.',
      },
      {
        icon: 'bookmark',
        text: 'Kamu dapat mengklik ikon bookmark untuk menandai soal untuk ditinjau, atau klik "lewati soal" untuk melewatinya.',
      },
      {
        icon: 'checkSquare',
        text: 'Klik "Selesaikan Ujian" untuk mengakhiri ujian dan melihat hasilmu segera.',
      },
    ],
  },
};
