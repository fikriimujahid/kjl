import type { OwnedProduct } from '@/features/products/types';
import { getOwnedProducts } from '@/infrastructure/api-clients/products.client';

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