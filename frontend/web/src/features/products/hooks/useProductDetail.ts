'use client';

import { useEffect, useState } from 'react';
import type { ProductDetail } from '../types';
import { fetchProductDetails } from '../services';

interface UseProductDetailsOptions {
  enabled?: boolean;
}

export function useProductDetails(productId: string, options: UseProductDetailsOptions = {}) {
  const { enabled = true } = options;
  const [productDetails, setProductDetails] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setProductDetails(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProductDetails() {
      setIsLoading(true);
      setProductDetails(null);

      const result = await fetchProductDetails({
        productId,
        signal: controller.signal,
      });

      if (!controller.signal.aborted) {
        setProductDetails(result);
        setIsLoading(false);
      }
    }

    loadProductDetails();

    return () => {
      controller.abort();
    };
  }, [enabled, productId]);

  return {
    productDetails,
    isLoading,
  };
}
