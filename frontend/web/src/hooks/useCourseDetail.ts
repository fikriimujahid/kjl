'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOwnedProducts } from '@/hooks/useOwnedProducts';
import { useProductDetails } from '@/hooks/useProductDetail';
import type { ProductDetail } from '@/types/product';

interface UseCourseDetailOptions {
  productId: string;
}

interface UseCourseDetailResult {
  selectedProduct: ProductDetail | null;
  isLoadingProduct: boolean;
  productError: string | null;
  hasOwnedProduct: boolean;
}

export function useCourseDetail({ productId }: UseCourseDetailOptions): UseCourseDetailResult {
  const { status, user, accessToken } = useAuth();
  const { ownedProducts, isLoadingOwnedProducts } = useOwnedProducts({
    status,
    userId: user?.id,
    accessToken,
  });

  const hasOwnedProduct = useMemo(() => {
    if (!productId) {
      return false;
    }

    return ownedProducts.some((ownedProduct) => {
      return ownedProduct.productId === productId || ownedProduct.id === productId;
    });
  }, [ownedProducts, productId]);

  const shouldLoadProductDetail = status === 'authenticated' && Boolean(productId) && hasOwnedProduct;
  const { productDetails, isLoading: isLoadingProductDetail } = useProductDetails(productId, {
    enabled: shouldLoadProductDetail,
  });

  const isLoadingProduct =
    status === 'loading' ||
    isLoadingOwnedProducts ||
    (hasOwnedProduct && isLoadingProductDetail);

  const productError = useMemo(() => {
    if (status === 'loading' || isLoadingOwnedProducts) {
      return null;
    }

    if (!productId) {
      return 'Produk tidak ditemukan.';
    }

    if (status !== 'authenticated') {
      return null;
    }

    if (!hasOwnedProduct) {
      return 'Produk tidak tersedia atau kamu belum memiliki akses.';
    }

    if (!isLoadingProductDetail && !productDetails) {
      return 'Produk tidak ditemukan.';
    }

    return null;
  }, [hasOwnedProduct, isLoadingOwnedProducts, isLoadingProductDetail, productDetails, productId, status]);

  return {
    selectedProduct: hasOwnedProduct ? productDetails : null,
    isLoadingProduct,
    productError,
    hasOwnedProduct,
  };
}