'use client';

import { useEffect, useState } from 'react';
import type { AuthStatus } from '@/types/auth';
import type { OwnedProduct } from '@/types/product';
import { getOwnedProducts } from '@/services/products/productsApi';

interface UseOwnedProductsOptions {
  status: AuthStatus;
  userId?: string;
  accessToken?: string | null;
}

interface UseOwnedProductsResult {
  ownedProducts: OwnedProduct[];
  isLoadingOwnedProducts: boolean;
}

export function useOwnedProducts({
  status,
  userId,
  accessToken,
}: UseOwnedProductsOptions): UseOwnedProductsResult {
  const [ownedProducts, setOwnedProducts] = useState<OwnedProduct[]>([]);
  const [isLoadingOwnedProducts, setIsLoadingOwnedProducts] = useState(true);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    if (status !== 'authenticated' || !userId) {
      setOwnedProducts([]);
      setIsLoadingOwnedProducts(false);
      return;
    }

    const authenticatedUserId = userId;
    const controller = new AbortController();
    let isActive = true;
    setIsLoadingOwnedProducts(true);

    async function loadProducts() {
      const nextOwnedProducts = await getOwnedProducts({
        signal: controller.signal,
        userId: authenticatedUserId,
        accessToken: accessToken ?? undefined,
      });

      if (!isActive) {
        return;
      }

      setOwnedProducts(nextOwnedProducts);
      setIsLoadingOwnedProducts(false);
    }

    loadProducts();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [accessToken, status, userId]);

  return { ownedProducts, isLoadingOwnedProducts };
}
