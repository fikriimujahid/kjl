import type { Product } from '@/features/products/types';
import type { AuthStatus } from '@/providers/auth.types';

export interface DashboardWordOfTheDay {
  word: string;
  reading: string;
  meaning: string;
  example: string;
  exampleTl: string;
}

export interface DashboardActivityWeek {
  label: string;
  values: number[];
}

export type DashboardProductProgress = Record<string, number>;

export interface UseOwnedProductsOptions {
  status: AuthStatus;
  userId?: string;
  accessToken?: string | null;
}

export interface UseOwnedProductsResult {
  ownedProducts: Product[];
  isLoadingOwnedProducts: boolean;
}