export interface PublicApiEnv {
  productApiBaseUrl: string;
  paymentApiBaseUrl: string;
  authApiBaseUrl: string;
}

export function getPublicApiEnv(): PublicApiEnv {
  return {
    productApiBaseUrl: process.env.PRODUCT_API_BASE_URL ?? '',
    paymentApiBaseUrl: process.env.PAYMENT_API_BASE_URL ?? '',
    authApiBaseUrl: process.env.AUTH_API_BASE_URL ?? '',
  };
}