import type { User, Product, Topic, Session, QuizData, Payment } from "./types";

// ─── Mock User ────────────────────────────────────────────────────────────────

export const mockUser: User = {
  id: "usr_001",
  email: "fikri@example.com",
  displayName: "Fikri Mujahid",
  createdAt: "2026-01-15T08:00:00Z",
};

// ─── Mock Products ────────────────────────────────────────────────────────────

export const mockProducts: Product[] = [
  {
    id: "PRODUCT_001",
    name: "Kisi-Kisi JFT Lengkap",
    slug: "kisi-kisi-jft-lengkap",
    price: 40000,
    description:
      "Paket lengkap kisi-kisi soal JFT (Japan Foundation Test) mencakup semua topik penting. Cocok untuk persiapan kerja ke Jepang.",
    topicsCount: 8,
    questionsCount: 350,
    accessType: "lifetime",
    category: "JFT",
    badge: "Terlaris",
  },
  {
    id: "PRODUCT_002",
    name: "JFT April – Mei 2026",
    slug: "jft-april-mei-2026",
    price: 25000,
    description:
      "Prediksi soal dan pembahasan JFT periode April–Mei 2026 berdasarkan pola soal terbaru. Update berkala sebelum ujian.",
    topicsCount: 5,
    questionsCount: 150,
    accessType: "lifetime",
    category: "JFT",
    badge: "Terbaru",
  },
  {
    id: "PRODUCT_003",
    name: "Latsol Kanji 350",
    slug: "latsol-kanji-350",
    price: 10000,
    description:
      "Latihan soal 350 kanji wajib JFT dan JLPT N4–N5 dengan furigana, arti, dan contoh kalimat. Belajar kanji lebih efisien.",
    topicsCount: 4,
    questionsCount: 350,
    accessType: "lifetime",
    category: "JLPT",
  },
  {
    id: "PRODUCT_004",
    name: "Latsol Hiragana Katakana",
    slug: "latsol-hiragana-katakana",
    price: 5000,
    description:
      "Latihan membaca dan menulis Hiragana dan Katakana dari dasar. Ideal untuk pemula yang baru mulai belajar bahasa Jepang.",
    topicsCount: 2,
    questionsCount: 80,
    accessType: "lifetime",
    category: "Dasar",
    badge: "Untuk Pemula",
  },
  {
    id: "PRODUCT_005",
    name: "Kosakata JLPT N4",
    slug: "kosakata-jlpt-n4",
    price: 15000,
    description:
      "Bank soal kosakata JLPT N4 lebih dari 500 kosakata penting. Dilengkapi audio pengucapan dan contoh penggunaan.",
    topicsCount: 6,
    questionsCount: 240,
    accessType: "lifetime",
    category: "JLPT",
  },
  {
    id: "PRODUCT_006",
    name: "Tata Bahasa JLPT N5",
    slug: "tata-bahasa-jlpt-n5",
    price: 12000,
    description:
      "Ringkasan dan latihan soal tata bahasa JLPT N5 lengkap dengan penjelasan dalam Bahasa Indonesia. Cocok untuk pemula.",
    topicsCount: 5,
    questionsCount: 200,
    accessType: "lifetime",
    category: "JLPT",
  },
];

// ─── Mock Topics ──────────────────────────────────────────────────────────────

export const mockTopics: Topic[] = [
  // PRODUCT_001 — Kisi-Kisi JFT Lengkap
  { id: "T001", productId: "PRODUCT_001", name: "Hiragana & Katakana", slug: "hiragana-katakana", sessionsCount: 3 },
  { id: "T002", productId: "PRODUCT_001", name: "Kanji Wajib JFT", slug: "kanji-wajib-jft", sessionsCount: 4 },
  { id: "T003", productId: "PRODUCT_001", name: "Kosakata Sehari-hari", slug: "kosakata-sehari-hari", sessionsCount: 3 },
  { id: "T004", productId: "PRODUCT_001", name: "Tata Bahasa Dasar", slug: "tata-bahasa-dasar", sessionsCount: 3 },
  { id: "T005", productId: "PRODUCT_001", name: "Percakapan & Situasi", slug: "percakapan-situasi", sessionsCount: 4 },
  { id: "T006", productId: "PRODUCT_001", name: "Membaca & Memahami", slug: "membaca-memahami", sessionsCount: 3 },
  { id: "T007", productId: "PRODUCT_001", name: "Mendengarkan (Listening)", slug: "listening", sessionsCount: 3 },
  { id: "T008", productId: "PRODUCT_001", name: "Simulasi Ujian", slug: "simulasi-ujian", sessionsCount: 2 },

  // PRODUCT_002 — JFT April – Mei 2026
  { id: "T009", productId: "PRODUCT_002", name: "Prediksi Soal Bagian 1", slug: "prediksi-bagian-1", sessionsCount: 3 },
  { id: "T010", productId: "PRODUCT_002", name: "Prediksi Soal Bagian 2", slug: "prediksi-bagian-2", sessionsCount: 3 },
  { id: "T011", productId: "PRODUCT_002", name: "Prediksi Soal Bagian 3", slug: "prediksi-bagian-3", sessionsCount: 2 },
  { id: "T012", productId: "PRODUCT_002", name: "Listening Terbaru", slug: "listening-terbaru", sessionsCount: 3 },
  { id: "T013", productId: "PRODUCT_002", name: "Simulasi Lengkap", slug: "simulasi-lengkap", sessionsCount: 2 },

  // PRODUCT_003 — Latsol Kanji 350
  { id: "T014", productId: "PRODUCT_003", name: "Kanji N5 (101 Kanji)", slug: "kanji-n5", sessionsCount: 4 },
  { id: "T015", productId: "PRODUCT_003", name: "Kanji N4 (150 Kanji)", slug: "kanji-n4", sessionsCount: 4 },
  { id: "T016", productId: "PRODUCT_003", name: "Kanji JFT Khusus", slug: "kanji-jft-khusus", sessionsCount: 3 },
  { id: "T017", productId: "PRODUCT_003", name: "Review & Kuis Final", slug: "review-final", sessionsCount: 2 },

  // PRODUCT_004 — Latsol Hiragana Katakana
  { id: "T018", productId: "PRODUCT_004", name: "Hiragana Dasar", slug: "hiragana-dasar", sessionsCount: 4 },
  { id: "T019", productId: "PRODUCT_004", name: "Katakana Dasar", slug: "katakana-dasar", sessionsCount: 4 },
];

// ─── Mock Sessions ────────────────────────────────────────────────────────────

export const mockSessions: Session[] = [
  // Topic T001 — Hiragana & Katakana
  { id: "S001", topicId: "T001", productId: "PRODUCT_001", name: "Sesi 1: あ〜こ", slug: "sesi-1", questionCount: 15, type: "quiz" },
  { id: "S002", topicId: "T001", productId: "PRODUCT_001", name: "Sesi 2: さ〜と", slug: "sesi-2", questionCount: 15, type: "quiz" },
  { id: "S003", topicId: "T001", productId: "PRODUCT_001", name: "Sesi 3: な〜ん", slug: "sesi-3", questionCount: 15, type: "quiz" },

  // Topic T002 — Kanji Wajib JFT
  { id: "S004", topicId: "T002", productId: "PRODUCT_001", name: "Sesi 1: Kanji Angka & Waktu", slug: "sesi-1", questionCount: 20, type: "quiz" },
  { id: "S005", topicId: "T002", productId: "PRODUCT_001", name: "Sesi 2: Kanji Benda Umum", slug: "sesi-2", questionCount: 20, type: "quiz" },
  { id: "S006", topicId: "T002", productId: "PRODUCT_001", name: "Sesi 3: Kanji Orang & Tempat", slug: "sesi-3", questionCount: 20, type: "quiz" },
  { id: "S007", topicId: "T002", productId: "PRODUCT_001", name: "Sesi 4: Kanji Kegiatan", slug: "sesi-4", questionCount: 20, type: "quiz" },

  // Topic T014 — Kanji N5
  { id: "S008", topicId: "T014", productId: "PRODUCT_003", name: "Sesi 1: Kanji 1–25", slug: "sesi-1", questionCount: 25, type: "quiz" },
  { id: "S009", topicId: "T014", productId: "PRODUCT_003", name: "Sesi 2: Kanji 26–50", slug: "sesi-2", questionCount: 25, type: "quiz" },
  { id: "S010", topicId: "T014", productId: "PRODUCT_003", name: "Sesi 3: Kanji 51–75", slug: "sesi-3", questionCount: 25, type: "quiz" },
  { id: "S011", topicId: "T014", productId: "PRODUCT_003", name: "Sesi 4: Kanji 76–101", slug: "sesi-4", questionCount: 26, type: "quiz" },

  // Topic T015 — Kanji N4
  { id: "S012", topicId: "T015", productId: "PRODUCT_003", name: "Sesi 1: Kanji 1–40", slug: "sesi-1", questionCount: 40, type: "quiz" },
  { id: "S013", topicId: "T015", productId: "PRODUCT_003", name: "Sesi 2: Kanji 41–80", slug: "sesi-2", questionCount: 40, type: "quiz" },
  { id: "S014", topicId: "T015", productId: "PRODUCT_003", name: "Sesi 3: Kanji 81–120", slug: "sesi-3", questionCount: 40, type: "quiz" },
  { id: "S015", topicId: "T015", productId: "PRODUCT_003", name: "Sesi 4: Kanji 121–150", slug: "sesi-4", questionCount: 30, type: "quiz" },

  // Topic T018 — Hiragana Dasar
  { id: "S016", topicId: "T018", productId: "PRODUCT_004", name: "Sesi 1: Baris あ〜お", slug: "sesi-1", questionCount: 10, type: "quiz" },
  { id: "S017", topicId: "T018", productId: "PRODUCT_004", name: "Sesi 2: Baris か〜こ", slug: "sesi-2", questionCount: 10, type: "quiz" },
  { id: "S018", topicId: "T018", productId: "PRODUCT_004", name: "Sesi 3: Baris さ〜そ", slug: "sesi-3", questionCount: 10, type: "quiz" },
  { id: "S019", topicId: "T018", productId: "PRODUCT_004", name: "Sesi 4: Kuis Gabungan", slug: "sesi-4", questionCount: 20, type: "quiz" },
];

// ─── Mock Quiz Data ───────────────────────────────────────────────────────────

export const mockQuizData: QuizData = {
  productId: "PRODUCT_003",
  topicSlug: "kanji-n4",
  sessionSlug: "sesi-1",
  questions: [
    {
      questionId: "Q001",
      questionText: "Apa arti dari kanji 日?",
      imageUrl: "https://placehold.co/320x200/4f46e5/ffffff?text=%E6%97%A5",
      audioUrl: null,
      options: ["Hari / Matahari", "Bulan", "Api", "Air"],
      correctAnswer: "Hari / Matahari",
    },
    {
      questionId: "Q002",
      questionText: "Bagaimana cara membaca kanji 山?",
      imageUrl: null,
      audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
      options: ["やま (yama)", "かわ (kawa)", "うみ (umi)", "そら (sora)"],
      correctAnswer: "やま (yama)",
    },
    {
      questionId: "Q003",
      questionText: "Kanji manakah yang berarti 'orang'?",
      imageUrl: null,
      audioUrl: null,
      options: ["人", "大", "子", "木"],
      correctAnswer: "人",
    },
    {
      questionId: "Q004",
      questionText: "Apa arti dari kanji 水?",
      imageUrl: null,
      audioUrl: null,
      options: ["Api", "Angin", "Air", "Tanah"],
      correctAnswer: "Air",
    },
    {
      questionId: "Q005",
      questionText: "Bagaimana membaca 月曜日?",
      imageUrl: null,
      audioUrl: null,
      options: ["かようび", "げつようび", "すいようび", "もくようび"],
      correctAnswer: "げつようび",
    },
    {
      questionId: "Q006",
      questionText: "Kanji 食 memiliki arti...",
      imageUrl: null,
      audioUrl: null,
      options: ["Minum", "Tidur", "Makan", "Berjalan"],
      correctAnswer: "Makan",
    },
    {
      questionId: "Q007",
      questionText: "Apa arti dari kata 学校 (がっこう)?",
      imageUrl: null,
      audioUrl: null,
      options: ["Rumah", "Sekolah", "Kantor", "Toko"],
      correctAnswer: "Sekolah",
    },
    {
      questionId: "Q008",
      questionText: "Kanji 車 dibaca...",
      imageUrl: null,
      audioUrl: null,
      options: ["でんしゃ", "くるま", "じてんしゃ", "バス"],
      correctAnswer: "くるま",
    },
    {
      questionId: "Q009",
      questionText: "Apa arti kanji 右?",
      imageUrl: null,
      audioUrl: null,
      options: ["Kiri", "Atas", "Kanan", "Bawah"],
      correctAnswer: "Kanan",
    },
    {
      questionId: "Q010",
      questionText: "Kata 電話 (でんわ) berarti...",
      imageUrl: null,
      audioUrl: null,
      options: ["Televisi", "Telepon", "Radio", "Komputer"],
      correctAnswer: "Telepon",
    },
  ],
};

// ─── Mock Payments ────────────────────────────────────────────────────────────

export const mockPayments: Payment[] = [
  {
    id: "PAY_001",
    productId: "PRODUCT_003",
    productName: "Latsol Kanji 350",
    amount: 10000,
    status: "success",
    createdAt: "2026-03-10T14:30:00Z",
  },
  {
    id: "PAY_002",
    productId: "PRODUCT_004",
    productName: "Latsol Hiragana Katakana",
    amount: 5000,
    status: "success",
    createdAt: "2026-03-08T09:15:00Z",
  },
  {
    id: "PAY_003",
    productId: "PRODUCT_001",
    productName: "Kisi-Kisi JFT Lengkap",
    amount: 40000,
    status: "failed",
    createdAt: "2026-02-20T11:00:00Z",
  },
];

// ─── Owned Product IDs (mock access list) ─────────────────────────────────────

export const mockOwnedProductIds: string[] = ["PRODUCT_003", "PRODUCT_004"];

// ─── Helper: format IDR currency ─────────────────────────────────────────────

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
