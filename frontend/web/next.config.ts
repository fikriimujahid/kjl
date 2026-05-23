import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const isStaticExport = process.env.NEXT_OUTPUT_MODE === 'export';

const nextConfig: NextConfig = {
  env: {
    PAYMENT_API_BASE_URL: process.env.PAYMENT_API_BASE_URL,
    PRODUCT_API_BASE_URL: process.env.PRODUCT_API_BASE_URL,
    LEARNING_API_BASE_URL: process.env.LEARNING_API_BASE_URL,
    AUTH_API_BASE_URL: process.env.AUTH_API_BASE_URL,
  },
  images: {
    unoptimized: true,
  },
  output: isStaticExport ? 'export' : undefined,
  outputFileTracingRoot: path.resolve(projectRoot, '../..'),
  skipTrailingSlashRedirect: isStaticExport,
  trailingSlash: isStaticExport,
};

export default nextConfig;