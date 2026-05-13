'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Product, ProductDetail } from '@/lib/types';
import { fetchProductDetails, fetchProducts } from '@/lib/api/products';
import { useAuth } from '@/hooks/useAuth';
import { createPayment, PaymentApiError } from '@/lib/payments';

interface UseProductsOptions {
  enabled?: boolean;
}

interface UseProductDetailsOptions {
  enabled?: boolean;
}

interface PurchaseProductOptions {
  productId: string;
  loginNextPath?: string;
  successPath?: string;
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

export type PaymentModalState =
  | { type: 'error'; message: string }
  | { type: 'already_owned'; productId: string }
  | null;

export function usePurchaseProduct() {
  const router = useRouter();
  const { status, idToken } = useAuth();

  const [isBuying, setIsBuying] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>(null);

  const purchaseProduct = useCallback(
    async ({ productId, loginNextPath, successPath = '/payment-success' }: PurchaseProductOptions) => {
      if (status !== 'authenticated' || !idToken) {
        const nextPath = loginNextPath ?? `/products?productId=${encodeURIComponent(productId)}`;
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setIsBuying(true);
      setPaymentModal(null);

      try {
        const payment = await createPayment({
          productId,
          idToken,
        });

        if (payment.redirectUrl) {
          window.location.assign(payment.redirectUrl);
          return;
        }

        router.push(successPath);
      } catch (error) {
        if (error instanceof PaymentApiError && error.statusCode === 409) {
          setPaymentModal({ type: 'already_owned', productId });
        } else {
          setPaymentModal({ type: 'error', message: 'Gagal membuat pembayaran. Silakan coba lagi.' });
        }
      } finally {
        setIsBuying(false);
      }
    },
    [idToken, router, status]
  );

  const clearPaymentModal = useCallback(() => {
    setPaymentModal(null);
  }, []);

  return {
    isBuying,
    paymentModal,
    purchaseProduct,
    clearPaymentModal,
  };
}