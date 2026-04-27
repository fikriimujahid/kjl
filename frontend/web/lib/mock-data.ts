import { Product, PaymentHistory, User } from '@/lib/types';

export const MOCK_USER: User = {
  id: 'u1',
  email: 'fikri@example.com',
  displayName: 'Fikri Haikal',
  purchasedProductIds: ['p1', 'p3'],
};

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'JFT-Basic April - Mei 2026',
    price: 150000,
    shortDescription: 'Persiapan intensif JFT-Basic dengan simulasi ujian terbaru.',
    description: 'Paket lengkap persiapan JFT-Basic yang mencakup tata bahasa, kosakata, pendengaran, dan percakapan sehari-hari sesuai standar ujan terbaru 2026.',
    level: 'JFT',
    topicsCount: 12,
    accessDurationDays: 30,
    featuredProducts: true,
    topics: [
      {
        id: 't1',
        title: 'Moji & Goi (Huruf & Kosakata)',
        sessions: [
          {
            id: 's1',
            title: 'Latihan Kosakata Dasar 1',
            type: 'quiz',
            questions: [
              {
                id: 'q1',
                text: 'Apa arti dari kata "Tabemasu"?',
                options: ['Makan', 'Minum', 'Tidur', 'Pergi'],
                correctAnswer: 'Makan',
              },
              {
                id: 'q2',
                text: 'Pilih kanji yang tepat untuk "Nihon":',
                options: ['日本', '一本', '本日', '日出'],
                correctAnswer: '日本',
              },
              {
                id: 'q3',
                text: 'Benda apakah yang ada pada gambar di bawah ini?',
                image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
                options: ['そば (Soba)', 'うどん (Udon)', 'らーめん (Ramen)', 'すし (Sushi)'],
                correctAnswer: 'そば (Soba)',
              },
              {
                id: 'q4',
                text: 'Dengarkan audio, lalu pilih kata yang kamu dengar:',
                audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
                options: ['ありがとう (Arigatou)', 'おはよう (Ohayou)', 'こんにちは (Konnichiwa)', 'さようなら (Sayounara)'],
                correctAnswer: 'ありがとう (Arigatou)',
              },
            ],
          },
          {
            id: 's2',
            title: 'Daftar Kosakata JFT (PDF)',
            type: 'pdf',
            contentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          },
          {
            id: 's2b',
            title: 'Panduan Tata Bahasa JFT (Baca Langsung)',
            type: 'pdf',
            contentUrl: 'https://pdfobject.com/pdf/sample.pdf',
          },
        ],
      },
      {
        id: 't2',
        title: 'Chokai (Mendengarkan)',
        sessions: [
          {
            id: 's3',
            title: 'Audio Latihan 1',
            type: 'audio',
            contentUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
          },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Kisi-Kisi JFT Lengkap 2026',
    price: 99000,
    shortDescription: 'Rangkuman materi paling sering keluar di ujian JFT.',
    description: 'Dapatkan rangkuman eksklusif materi JFT yang disusun berdasarkan statistik soal yang paling sering muncul dalam 3 tahun terakhir.',
    level: 'JFT',
    topicsCount: 8,
    accessDurationDays: 30,
    topics: [],
  },
  {
    id: 'p3',
    name: 'Latihan Kanji N4 (350 Kanji)',
    price: 125000,
    shortDescription: 'Kuasai 350 Kanji JLPT N4 dengan metode mnemonik.',
    description: 'Belajar Kanji N4 menjadi lebih menyenangkan dengan gambar dan cerita mnemonik yang memudahkan ingatan jangka panjang.',
    level: 'N4',
    topicsCount: 15,
    accessDurationDays: 30,
    featuredProducts: true,
    topics: [
      {
        id: 't3',
        title: 'Kanji Alam & Cuaca',
        sessions: [
          {
            id: 's4',
            title: 'Kuis Kanji Alam',
            type: 'quiz',
            questions: [
              {
                id: 'q3',
                text: 'Apa arti dari kanji 日?',
                options: ['Hari/Matahari', 'Bulan', 'Api', 'Air'],
                correctAnswer: 'Hari/Matahari',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'p4',
    name: 'Master Hiragana & Katakana',
    price: 45000,
    shortDescription: 'Langkah awal belajar bahasa Jepang untuk pemula.',
    description: 'Panduan interaktif membaca dan menulis Hiragana dan Katakana dalam waktu kurang dari seminggu.',
    level: 'N5',
    topicsCount: 5,
    accessDurationDays: 30,
    topics: [],
  },
  {
    id: 'p5',
    name: 'Simulasi JLPT N3 Part 1',
    price: 175000,
    shortDescription: 'Trial ujian N3 dengan tingkat kesulitan standar JLPT.',
    description: 'Uji kemampuanmu sebelum hari H dengan simulasi yang memiliki durasi dan tingkat kesulitan yang sama dengan ujian asli.',
    level: 'N3',
    topicsCount: 10,
    accessDurationDays: 30,
    topics: [],
  },
  {
    id: 'p6',
    name: 'E-Book Tata Bahasa N2',
    price: 210000,
    shortDescription: 'Koleksi Bunpou N2 lengkap dengan contoh kalimat.',
    description: 'Buku digital yang merangkum seluruh tata bahasa level N2 dengan penjelasan bahasa Indonesia yang mudah dimengerti.',
    level: 'N2',
    topicsCount: 20,
    accessDurationDays: 30,
    topics: [],
  },
];

export const MOCK_PRODUCTS_PUBLIC: Product[] = [
  {
    id: 'p0',
    name: 'Japanese Beginner Basic (Pemula)',
    price: 1100,
    shortDescription: 'Belajar bahasa Jepang dari nol untuk pemula.',
    description: 'Paket dasar untuk pemula yang belum pernah belajar bahasa Jepang. Fokus pada huruf Hiragana, salam dasar, dan pengucapan sederhana.',
    level: 'Beginner',
    topicsCount: 3,
    accessDurationDays: 30,
    featuredProducts: true,
    topics: [
      {
        id: 't0',
        title: 'Hiragana Dasar',
        sessions: [
          { id: 's0', title: 'Video Pengenalan Hiragana', type: 'video' },
          { id: 's0b', title: 'Tabel Hiragana Lengkap (PDF)', type: 'pdf' },
          { id: 's0c', title: 'Audio Pelafalan Hiragana', type: 'audio' },
          { id: 's0d', title: 'Quiz Hiragana Dasar', type: 'quiz' },
        ],
      },
      {
        id: 't1',
        title: 'Salam Dasar',
        sessions: [
          { id: 's1', title: 'Video Salam Dasar', type: 'video' },
          { id: 's1b', title: 'Daftar Salam Dasar (PDF)', type: 'pdf' },
          { id: 's1c', title: 'Audio Salam Dasar', type: 'audio' },
          { id: 's1d', title: 'Quiz Salam Dasar', type: 'quiz' },
        ],
      },
      {
        id: 't2',
        title: 'Perkenalan Diri Sederhana',
        sessions: [
          { id: 's2', title: 'Video Perkenalan Diri', type: 'video' },
          { id: 's2b', title: 'Contoh Perkenalan (PDF)', type: 'pdf' },
          { id: 's2c', title: 'Audio Perkenalan', type: 'audio' },
          { id: 's2d', title: 'Quiz Perkenalan', type: 'quiz' },
        ],
      },
    ],
  },
  {
    id: 'p1',
    name: 'Katakana & Kosakata Dasar',
    price: 1500,
    shortDescription: 'Belajar huruf Katakana dan kosakata dasar sehari-hari.',
    description: 'Paket ini membantu siswa menguasai Katakana dan memahami kosakata dasar seperti angka, waktu, dan benda sehari-hari.',
    level: 'Beginner',
    topicsCount: 3,
    accessDurationDays: 30,
    featuredProducts: true,
    topics: [
      {
        id: 't0',
        title: 'Katakana Dasar',
        sessions: [
          { id: 's0', title: 'Video Pengenalan Katakana', type: 'video' },
          { id: 's0b', title: 'Tabel Katakana Lengkap (PDF)', type: 'pdf' },
          { id: 's0c', title: 'Audio Pelafalan Katakana', type: 'audio' },
          { id: 's0d', title: 'Quiz Katakana Dasar', type: 'quiz' },
        ],
      },
      {
        id: 't1',
        title: 'Angka & Waktu',
        sessions: [
          { id: 's1', title: 'Video Angka Jepang', type: 'video' },
          { id: 's1b', title: 'Daftar Angka (PDF)', type: 'pdf' },
          { id: 's1c', title: 'Audio Angka', type: 'audio' },
          { id: 's1d', title: 'Quiz Angka', type: 'quiz' },
        ],
      },
      {
        id: 't2',
        title: 'Benda Sehari-hari',
        sessions: [
          { id: 's2', title: 'Video Kosakata Benda', type: 'video' },
          { id: 's2b', title: 'Kosakata Benda (PDF)', type: 'pdf' },
          { id: 's2c', title: 'Audio Kosakata', type: 'audio' },
          { id: 's2d', title: 'Quiz Kosakata', type: 'quiz' },
        ],
      },
    ],
  },
  {
    id: 'p2',
    name: 'Grammar Dasar N5',
    price: 2000,
    shortDescription: 'Memahami tata bahasa dasar bahasa Jepang.',
    description: 'Paket ini mengajarkan struktur kalimat dasar bahasa Jepang termasuk partikel dan kata kerja sederhana.',
    level: 'Beginner',
    topicsCount: 3,
    accessDurationDays: 30,
    topics: [
      {
        id: 't0',
        title: 'Struktur Kalimat Dasar',
        sessions: [
          { id: 's0', title: 'Video Struktur Kalimat', type: 'video' },
          { id: 's0b', title: 'Contoh Kalimat (PDF)', type: 'pdf' },
          { id: 's0c', title: 'Audio Contoh Kalimat', type: 'audio' },
          { id: 's0d', title: 'Quiz Struktur Kalimat', type: 'quiz' },
        ],
      },
      {
        id: 't1',
        title: 'Partikel Dasar (は、が、を)',
        sessions: [
          { id: 's1', title: 'Video Partikel Dasar', type: 'video' },
          { id: 's1b', title: 'Penjelasan Partikel (PDF)', type: 'pdf' },
          { id: 's1c', title: 'Audio Contoh', type: 'audio' },
          { id: 's1d', title: 'Quiz Partikel', type: 'quiz' },
        ],
      },
      {
        id: 't2',
        title: 'Kata Kerja Dasar',
        sessions: [
          { id: 's2', title: 'Video Kata Kerja', type: 'video' },
          { id: 's2b', title: 'Daftar Kata Kerja (PDF)', type: 'pdf' },
          { id: 's2c', title: 'Audio Kata Kerja', type: 'audio' },
          { id: 's2d', title: 'Quiz Kata Kerja', type: 'quiz' },
        ],
      },
    ],
  },
  {
    id: 'p3',
    name: 'Listening & Percakapan Dasar',
    price: 2200,
    shortDescription: 'Latihan mendengarkan dan percakapan dasar.',
    description: 'Paket ini fokus pada pemahaman percakapan sehari-hari melalui latihan listening dan dialog sederhana.',
    level: 'Beginner',
    topicsCount: 3,
    accessDurationDays: 30,
    topics: [
      {
        id: 't0',
        title: 'Percakapan Salam',
        sessions: [
          { id: 's0', title: 'Video Percakapan Salam', type: 'video' },
          { id: 's0b', title: 'Transkrip Percakapan (PDF)', type: 'pdf' },
          { id: 's0c', title: 'Audio Percakapan', type: 'audio' },
          { id: 's0d', title: 'Quiz Listening Salam', type: 'quiz' },
        ],
      },
      {
        id: 't1',
        title: 'Percakapan di Tempat Umum',
        sessions: [
          { id: 's1', title: 'Video Percakapan Umum', type: 'video' },
          { id: 's1b', title: 'Transkrip Percakapan (PDF)', type: 'pdf' },
          { id: 's1c', title: 'Audio Percakapan', type: 'audio' },
          { id: 's1d', title: 'Quiz Listening', type: 'quiz' },
        ],
      },
      {
        id: 't2',
        title: 'Percakapan di Toko',
        sessions: [
          { id: 's2', title: 'Video Percakapan di Toko', type: 'video' },
          { id: 's2b', title: 'Transkrip Percakapan (PDF)', type: 'pdf' },
          { id: 's2c', title: 'Audio Percakapan', type: 'audio' },
          { id: 's2d', title: 'Quiz Listening', type: 'quiz' },
        ],
      },
    ],
  },
];

export const MOCK_PAYMENTS: PaymentHistory[] = [
  {
    id: 'pay1',
    productName: 'JFT-Basic April - Mei 2026',
    date: '2026-03-15',
    amount: 150000,
    status: 'Success',
  },
  {
    id: 'pay2',
    productName: 'Latihan Kanji N4 (350 Kanji)',
    date: '2026-04-01',
    amount: 125000,
    status: 'Success',
  },
  {
    id: 'pay3',
    productName: 'Master Hiragana & Katakana',
    date: '2026-04-10',
    amount: 45000,
    status: 'Failed',
  },
];