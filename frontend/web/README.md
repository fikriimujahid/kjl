# KeJepangDulu Frontend

This frontend now runs on Next.js App Router in place under frontend/web.

## Local Development

Prerequisite: Node.js 20+

1. Install dependencies with `npm install`
2. Start the development server with `npm run dev`
3. Open `http://localhost:3000`

## Build Modes

- `npm run build`: SSR-capable build for `npm run start`
- `npm run start`: run the SSR-capable build locally
- `npm run export`: static export build for S3 + CloudFront deployment

## Environment

Copy `.env.example` to `.env.local` if you need to override the product API source.

- `NEXT_PUBLIC_API_BASE_URL`: product API base URL used by `fetchProducts`, example `https://kjl.fikri.dev/api`.
- `fetchProducts` calls `${NEXT_PUBLIC_API_BASE_URL}/products` via GET.

## Deployment Targets

- Static export: deploy the `out` directory to S3 + CloudFront
- SSR runtime: deploy the `.next` output and run `npm run start` on EC2
