'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createPayment } from '@/lib/payments';

interface PurchaseProductOptions {
  productId: string;
  loginNextPath?: string;
  successPath?: string;
}

export function usePurchaseProduct() {
  const router = useRouter();
  const { status, idToken } = useAuth();

  const [isBuying, setIsBuying] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const purchaseProduct = useCallback(
    async ({ productId, loginNextPath, successPath = '/payment-success' }: PurchaseProductOptions) => {
      if (status !== 'authenticated' || !idToken) {
        const nextPath = loginNextPath ?? `/products?productId=${encodeURIComponent(productId)}`;
        router.push(`/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setIsBuying(true);
      setPaymentError(null);

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
      } catch {
        setPaymentError('Gagal membuat pembayaran. Silakan coba lagi.');
      } finally {
        setIsBuying(false);
      }
    },
    [idToken, router, status]
  );

  const clearPaymentError = useCallback(() => {
    setPaymentError(null);
  }, []);

  return {
    isBuying,
    paymentError,
    purchaseProduct,
    clearPaymentError,
  };
}
