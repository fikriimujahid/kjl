import type { Product } from '@/features/products/types';
import { getOwnedProducts } from '@/features/products/services';

interface FetchDashboardOwnedProductsOptions {
  signal?: AbortSignal;
  userId: string;
  accessToken?: string;
}

export async function fetchDashboardOwnedProducts({
  signal,
  userId,
  accessToken,
}: FetchDashboardOwnedProductsOptions): Promise<Product[]> {
  return getOwnedProducts({
    signal,
    userId,
    accessToken,
  });
}