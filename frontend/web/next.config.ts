import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const catalogSourceUrl = process.env.CATALOG_SOURCE_URL ?? 'https://kjl.fikri.dev/public-data/catalog.json';

const isStaticExport =
  process.env.NEXT_OUTPUT_MODE === 'export' ||
  process.env.npm_lifecycle_event === 'export';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  output: isStaticExport ? 'export' : undefined,
  outputFileTracingRoot: path.resolve(projectRoot, '../..'),
  ...(!isStaticExport
    ? {
        rewrites: async () => [
          {
            source: '/catalog-proxy',
            destination: catalogSourceUrl,
          },
        ],
      }
    : {}),
  skipTrailingSlashRedirect: isStaticExport,
  trailingSlash: isStaticExport,
};

export default nextConfig;