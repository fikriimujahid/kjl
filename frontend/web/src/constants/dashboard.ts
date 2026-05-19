import { DashboardActivityWeek, DashboardProductProgress, DashboardWordOfTheDay } from "@/types/dashboard";

export const STREAK_DAYS = 7;

export const WORD_OF_THE_DAY: DashboardWordOfTheDay = {
  word: '頑張る',
  reading: 'がんばる · ganbaru',
  meaning: 'Berusaha keras; pantang menyerah',
  example: '毎日頑張っています。',
  exampleTl: 'Saya berusaha keras setiap hari.',
};

export const DAILY_ACTIVITY: DashboardActivityWeek[] = [
  { label: '3 Minggu Lalu', values: [100, 0, 100, 100, 0, 100, 100] },
  { label: '2 Minggu Lalu', values: [100, 100, 0, 100, 100, 100, 0] },
  { label: 'Minggu Ini', values: [100, 100, 100, 100, 0, 0, 0] },
];

export const DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

export const PRODUCT_PROGRESS: DashboardProductProgress = { p1: 42, p3: 17 };