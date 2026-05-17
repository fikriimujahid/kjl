'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { createPayment, PaymentApiError } from '@/infrastructure/api-clients/payments.client';
import type { PaymentModalState } from '../types';

interface PurchaseProductOptions {
  productId: string;
  loginNextPath?: string;
  successPath?: string;
}

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
    [idToken, router, status],
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
