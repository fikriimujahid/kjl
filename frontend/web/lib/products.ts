import { Product, PurchasedProduct } from '@/lib/types';

export const PRODUCT_URL = process.env.NEXT_PUBLIC_PRODUCT_URL;

function normalizeUrl(url?: string): string | null {
  const normalized = url?.trim();
  return normalized ? normalized : null;
}

export function parseProducts(data: unknown): Product[] {
  if (Array.isArray(data)) {
    return data as Product[];
  }

  return [];
}

interface FetchProductsOptions {
  url?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
}

interface LoadOwnedProductsOptions extends FetchProductsOptions {
  userId: string;
  purchases: PurchasedProduct[];
}

export async function fetchProducts({
  url,
  signal,
}: FetchProductsOptions = {}): Promise<Product[]> {
  const targetUrl = normalizeUrl(url ?? PRODUCT_URL);
  if (!targetUrl) {
    return [];
  }

  try {
    const response = await fetch(targetUrl, {
      signal,
    });

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();
    return parseProducts(data);
  } catch {
    return [];
  }
}

export async function loadOwnedProducts({
  userId,
  purchases,
  url,
  signal,
}: LoadOwnedProductsOptions): Promise<Product[]> {
  const products = await fetchProducts({ url, signal });
  const purchasedProductIds = new Set(
    purchases
      .filter((purchase) => purchase.userId === userId)
      .map((purchase) => purchase.productId),
  );

  return products.filter((product) => purchasedProductIds.has(product.id));
}