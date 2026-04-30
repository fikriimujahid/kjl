import { SessionDetail, PaymentHistory, User, PurchasedProduct } from '@/lib/types';

export const MOCK_USER: User = {
  id: 'u1',
  email: 'fikri@example.com',
  displayName: 'Fikri Haikal',
  purchasedProductIds: ['p0', 'p3'],
};

export const MOCK_PURCHASED_PRODUCTS: PurchasedProduct[] = [
  {
    id: 'pp1',
    productId: 'p0',
    userId: '491a856c-00a1-701a-b7b6-dfeb5db1e6fe',
    purchaseDate: '2026-03-15',
    accessExpiryDate: '2027-04-14',
  },
  {
    id: 'pp2',
    productId: 'p1',
    userId: '491a856c-00a1-701a-b7b6-dfeb5db1e6fe',
    purchaseDate: '2026-03-15',
    accessExpiryDate: '2026-04-14',
  }
];

export const MOCK_SESSION_DETAILS_IMAGE: SessionDetail[] = [
  {
    id: '1',
    contentUrl: '/public/public-data/1_Apa-itu-Hiragana.png',
  },
  {
    id: '2',
    contentUrl: '/public/public-data/2_Tujuan-Pembelajaran.png',
  }
]

export const MOCK_SESSION_DETAILS_QUIZ: SessionDetail[] = [
  {
    id: 'q1',
    text: 'Apa arti dari kata "Tabemasu"?',
    options: ['Makan', 'Minum', 'Tidur', 'Pergi']
  },
  {
    id: 'q2',
    text: 'Pilih kanji yang tepat untuk "Nihon":',
    options: ['日本', '一本', '本日', '日出']
  },
  {
    id: 'q3',
    text: 'Benda apakah yang ada pada gambar di bawah ini?',
    image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    options: ['そば (Soba)', 'うどん (Udon)', 'らーめん (Ramen)', 'すし (Sushi)']
  },
  {
    id: 'q4',
    text: 'Dengarkan audio, lalu pilih kata yang kamu dengar:',
    audio: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    options: ['ありがとう (Arigatou)', 'おはよう (Ohayou)', 'こんにちは (Konnichiwa)', 'さようなら (Sayounara)']
  },
]

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