export interface HomeStep {
  num: string;
  title: string;
  desc: string;
}

export const HOME_STEPS: HomeStep[] = [
  { num: '01', title: 'Buat Akun', desc: 'Daftar gratis dalam hitungan detik. Tidak perlu kartu kredit.' },
  { num: '02', title: 'Pilih Paket', desc: 'Temukan paket yang sesuai — JFT, JLPT, kanji, atau kosakata.' },
  {
    num: '03',
    title: 'Bayar & Akses',
    desc: 'Pembayaran aman via berbagai metode. Materi tersedia langsung setelah transaksi.',
  },
  { num: '04', title: 'Mulai Belajar', desc: 'Kerjakan soal, lacak progres, dan tingkatkan skor ujianmu.' },
];
