import type { OwnedProduct } from '@/features/products/types';
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
}: FetchDashboardOwnedProductsOptions): Promise<OwnedProduct[]> {
  return getOwnedProducts({
    signal,
    userId,
    accessToken,
  });
}