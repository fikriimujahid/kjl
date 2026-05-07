import { Product, PurchasedProduct, SessionDetail } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_API_BASE_URL ?? '/api';
const PURCHASED_PRODUCTS_ENDPOINT = '/purchased-products';
const PRODUCTS_ENDPOINT = '/products';
const PUBLIC_PRODUCT_URL = process.env.NEXT_PUBLIC_PRODUCT_URL ?? '';

interface FetchProductsOptions {
  url?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
}

interface LoadOwnedProductsOptions extends FetchProductsOptions {
  userId: string;
  purchases?: PurchasedProduct[];
  purchasesUrl?: string;
  accessToken?: string;
}

interface FetchPurchasedProductsOptions {
  userId: string;
  url?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  accessToken?: string;
}

interface FetchProductSessionDetailsOptions {
  productId: string;
  topicId: string;
  sessionId: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  accessToken?: string;
}

interface FetchPurchasedProductDetailsOptions {
  userId: string;
  productId: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  accessToken?: string;
}

export async function fetchProducts({
  signal,
  cache = 'no-store',
}: FetchProductsOptions = {}): Promise<Product[]> {
  try {
    const response = await fetch(PUBLIC_PRODUCT_URL, {
      signal,
      cache,
    });

    if (!response.ok) {
      return [];
    }

    const data: Product[] = await response.json();
    return data;
  } catch {
    return [];
  }
}

export async function loadOwnedProducts({
  signal,
  userId,
  accessToken,
}: LoadOwnedProductsOptions): Promise<Product[]> {
  const [products, purchasedProductsFromApi] = await Promise.all([
    fetchProducts({ signal }),
    fetchPurchasedProductsByUser({
      userId,
      signal,
      accessToken,
    }),
  ]);

  const purchasedProductIds = new Set(
    (purchasedProductsFromApi ?? []).map((purchase) => purchase.productId),
  );

  return products.filter((product) => purchasedProductIds.has(product.id));
}

export async function fetchPurchasedProductsByUser({
  userId,
  signal,
  accessToken,
}: FetchPurchasedProductsOptions): Promise<PurchasedProduct[] | null> {
  try {
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(`${API_BASE_URL}${PURCHASED_PRODUCTS_ENDPOINT}/${encodeURIComponent(userId)}`, {
      signal,
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data: PurchasedProduct[] = await response.json();
    return data;
  } catch {
    return null;
  }
}

export async function fetchPurchasedProductDetails({
  userId,
  productId,
  signal,
  cache = 'no-store',
  accessToken,
}: FetchPurchasedProductDetailsOptions): Promise<Product | null> {
  try {
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(
      `${API_BASE_URL}/purchased-product/${encodeURIComponent(userId)}/product/${encodeURIComponent(productId)}`,
      {
        signal,
        cache,
        headers,
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: Product = await response.json();
    return data;
  } catch {
    return null;
  }
}

export async function fetchProductSessionDetails({
  productId,
  topicId,
  sessionId,
  signal,
  cache = 'no-store',
  accessToken,
}: FetchProductSessionDetailsOptions): Promise<SessionDetail[] | null> {
  try {
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(
      `${API_BASE_URL}${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}`,
      {
        signal,
        cache,
        headers,
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: SessionDetail[] = await response.json();
    return data;
  } catch {
    return null;
  }
}

