import type { HomeFeature } from '../types';

export type { FeatureIcon, HomeFeature } from '../types';

export const HOME_FEATURES: HomeFeature[] = [
  {
    icon: 'zap',
    title: 'Akses Instan',
    desc: 'Setelah pembayaran berhasil, materi langsung tersedia tanpa perlu menunggu konfirmasi manual.',
  },
  {
    icon: 'lock',
    title: 'Materi Terstruktur & Terpercaya',
    desc: 'Semua materi disusun secara sistematis dan mengikuti standar ujian terbaru, sehingga kamu belajar dengan arah yang jelas.',
  },
  {
    icon: 'smartphone',
    title: 'Mobile-Friendly',
    desc: 'Tampilan dioptimalkan untuk semua perangkat. Belajar kapan saja dan di mana saja tanpa hambatan.',
  },
  {
    icon: 'check-circle',
    title: 'Akses Fleksibel',
    desc: 'Durasi akses disesuaikan dengan paket yang dipilih, sehingga kamu bisa belajar sesuai kebutuhan.',
  },
];