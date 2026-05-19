'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types/product';
import { fetchProducts } from '@/services/products/productsApi';

interface UseProductsOptions {
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { enabled = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setProducts([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    async function loadProducts() {
      try {
        setError(null);

        const data = await fetchProducts({
          signal: controller.signal,
        });

        if (!controller.signal.aborted) {
          setProducts(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('Failed to load products');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => controller.abort();
  }, [enabled]);

  return {
    products,
    loading,
    error,
  };
}
