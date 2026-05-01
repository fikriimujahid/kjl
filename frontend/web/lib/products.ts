import { Product, PurchasedProduct } from '@/lib/types';

const API_BASE_URL = process.env.NEXT_API_BASE_URL;
const PRODUCTS_ENDPOINT = '/products';
const PURCHASED_PRODUCTS_ENDPOINT = '/purchased-products';

function buildProductsUrl(baseUrl?: string): string | null {
  const normalizedBaseUrl = normalizeUrl(baseUrl);
  if (!normalizedBaseUrl) {
    return null;
  }

  return `${normalizedBaseUrl.replace(/\/+$/, '')}${PRODUCTS_ENDPOINT}`;
}

export const PRODUCT_URL =
  buildProductsUrl(API_BASE_URL) ?? process.env.NEXT_PUBLIC_PRODUCT_URL;

function buildPurchasedProductsUrl(baseUrl: string, userId: string): string {
  return `${baseUrl.replace(/\/+$/, '')}${PURCHASED_PRODUCTS_ENDPOINT}/${encodeURIComponent(userId)}`;
}

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

export function parsePurchasedProducts(data: unknown): PurchasedProduct[] {
  if (Array.isArray(data)) {
    return data as PurchasedProduct[];
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

export async function fetchProducts({
  url,
  signal,
  cache = 'no-store',
}: FetchProductsOptions = {}): Promise<Product[]> {
  const targetUrl = normalizeUrl(url ?? PRODUCT_URL);
  if (!targetUrl) {
    return [];
  }

  try {
    const response = await fetch(targetUrl, {
      signal,
      cache,
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

export async function fetchPurchasedProductsByUser({
  userId,
  url,
  signal,
  cache = 'no-store',
  accessToken,
}: FetchPurchasedProductsOptions): Promise<PurchasedProduct[] | null> {
  const baseUrl = normalizeUrl(API_BASE_URL);
  const targetUrl = normalizeUrl(url) ?? (baseUrl ? buildPurchasedProductsUrl(baseUrl, userId) : null);
  if (!targetUrl) {
    return null;
  }

  try {
    const headers: HeadersInit = accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {};

    const response = await fetch(targetUrl, {
      signal,
      cache,
      headers,
    });

    if (!response.ok) {
      return null;
    }

    const data: unknown = await response.json();
    return parsePurchasedProducts(data);
  } catch {
    return null;
  }
}

export async function loadOwnedProducts({
  userId,
  purchases,
  url,
  purchasesUrl,
  signal,
  accessToken,
}: LoadOwnedProductsOptions): Promise<Product[]> {
  const products = await fetchProducts({ url, signal });
  const purchasedProductsFromApi = await fetchPurchasedProductsByUser({
    userId,
    url: purchasesUrl,
    signal,
    accessToken,
  });
  const fallbackPurchases = purchases ?? [];
  const effectivePurchases = purchasedProductsFromApi ?? fallbackPurchases;

  const purchasedProductIds = new Set(
    effectivePurchases
      .filter((purchase) => purchase.userId === userId)
      .map((purchase) => purchase.productId),
  );

  return products.filter((product) => purchasedProductIds.has(product.id));
}