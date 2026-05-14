import type {
  Product,
  ProductDetail,
  PurchasedProduct,
  SessionDetail,
} from '../types';

const PRODUCT_API_BASE_URL = (process.env.PRODUCT_API_BASE_URL ?? '/api').replace(/\/+$/, '');
const OWNED_PRODUCTS_ENDPOINT = '/owned';
const PRODUCTS_ENDPOINT = '/products';

interface FetchOptions {
  url?: string;
  signal?: AbortSignal;
  cache?: RequestCache;
}

interface GetOwnedProductsOptions {
  userId: string;
  signal?: AbortSignal;
  cache?: RequestCache;
  accessToken?: string;
}

interface FetchProductDetailsOptions {
  productId: string;
  signal?: AbortSignal;
  cache?: RequestCache;
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

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === 'string' && typeof candidate.name === 'string';
}

function isPurchasedProduct(value: unknown): value is PurchasedProduct {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return typeof candidate.productId === 'string' && typeof candidate.userId === 'string';
}

export async function fetchProducts({
  signal,
  cache = 'no-store',
}: FetchOptions = {}): Promise<Product[]> {
  try {
    const response = await fetch(`${PRODUCT_API_BASE_URL}`, {
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

export async function fetchProductDetails({
  productId,
  signal,
  cache = 'no-store',
}: FetchProductDetailsOptions): Promise<ProductDetail | null> {
  try {
    const response = await fetch(
      `${PRODUCT_API_BASE_URL}/${encodeURIComponent(productId)}`,
      {
        signal,
        cache,
      },
    );

    if (!response.ok) {
      return null;
    }

    const data: ProductDetail = await response.json();
    return data;
  } catch {
    return null;
  }
}

export async function getOwnedProducts({
  userId,
  signal,
  cache = 'no-store',
  accessToken,
}: GetOwnedProductsOptions): Promise<Product[]> {
  try {
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(
      `${PRODUCT_API_BASE_URL}${OWNED_PRODUCTS_ENDPOINT}/${encodeURIComponent(userId)}`,
      {
        signal,
        cache,
        headers,
      },
    );

    if (!response.ok) {
      return [];
    }

    const data: unknown = await response.json();

    if (Array.isArray(data) && data.every(isProduct)) {
      return data;
    }

    if (Array.isArray(data) && data.every(isPurchasedProduct)) {
      const purchasedProductIds = new Set(data.map((purchase) => purchase.productId));

      if (purchasedProductIds.size === 0) {
        return [];
      }

      const products = await fetchProducts({ signal, cache });
      return products.filter((product) => purchasedProductIds.has(product.id));
    }

    return [];
  } catch {
    return [];
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
      `${PRODUCT_API_BASE_URL}/purchased-product/${encodeURIComponent(userId)}/product/${encodeURIComponent(productId)}`,
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
      `${PRODUCT_API_BASE_URL}${PRODUCTS_ENDPOINT}/${encodeURIComponent(productId)}/topics/${encodeURIComponent(topicId)}/sessions/${encodeURIComponent(sessionId)}`,
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