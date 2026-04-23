/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, PaymentHistory, User } from './types';

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
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400',
    level: 'JFT',
    topicsCount: 12,
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
              }
            ]
          },
          {
            id: 's2',
            title: 'Daftar Kosakata JFT (PDF)',
            type: 'pdf',
            contentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
          },
          {
            id: 's2b',
            title: 'Panduan Tata Bahasa JFT (Baca Langsung)',
            type: 'pdf',
            contentUrl: 'https://pdfobject.com/pdf/sample.pdf'
          }
        ]
      },
      {
        id: 't2',
        title: 'Chokai (Mendengarkan)',
        sessions: [
          {
            id: 's3',
            title: 'Audio Latihan 1',
            type: 'audio',
            contentUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
          }
        ]
      }
    ]
  },
  {
    id: 'p2',
    name: 'Kisi-Kisi JFT Lengkap 2026',
    price: 99000,
    shortDescription: 'Rangkuman materi paling sering keluar di ujian JFT.',
    description: 'Dapatkan rangkuman eksklusif materi JFT yang disusun berdasarkan statistik soal yang paling sering muncul dalam 3 tahun terakhir.',
    image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400',
    level: 'JFT',
    topicsCount: 8,
    topics: []
  },
  {
    id: 'p3',
    name: 'Latihan Kanji N4 (350 Kanji)',
    price: 125000,
    shortDescription: 'Kuasai 350 Kanji JLPT N4 dengan metode mnemonik.',
    description: 'Belajar Kanji N4 menjadi lebih menyenangkan dengan gambar dan cerita mnemonik yang memudahkan ingatan jangka panjang.',
    image: 'https://images.unsplash.com/photo-1578632292335-df3abbb0d586?auto=format&fit=crop&q=80&w=400',
    level: 'N4',
    topicsCount: 15,
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
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'p4',
    name: 'Master Hiragana & Katakana',
    price: 45000,
    shortDescription: 'Langkah awal belajar bahasa Jepang untuk pemula.',
    description: 'Panduan interaktif membaca dan menulis Hiragana dan Katakana dalam waktu kurang dari seminggu.',
    image: 'https://images.unsplash.com/photo-1580121441575-41bcb5cf294e?auto=format&fit=crop&q=80&w=400',
    level: 'N5',
    topicsCount: 5,
    topics: []
  },
  {
    id: 'p5',
    name: 'Simulasi JLPT N3 Part 1',
    price: 175000,
    shortDescription: 'Trial ujian N3 dengan tingkat kesulitan standar JLPT.',
    description: 'Uji kemampuanmu sebelum hari H dengan simulasi yang memiliki durasi dan tingkat kesulitan yang sama dengan ujian asli.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400',
    level: 'N3',
    topicsCount: 10,
    topics: []
  },
  {
    id: 'p6',
    name: 'E-Book Tata Bahasa N2',
    price: 210000,
    shortDescription: 'Koleksi Bunpou N2 lengkap dengan contoh kalimat.',
    description: 'Buku digital yang merangkum seluruh tata bahasa level N2 dengan penjelasan bahasa Indonesia yang mudah dimengerti.',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400',
    level: 'N2',
    topicsCount: 20,
    topics: []
  }
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
  }
];
