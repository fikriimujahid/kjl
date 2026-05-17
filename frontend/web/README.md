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

Dual mode is intentionally supported:

- SSR mode uses `.next` output and `npm run start`.
- Static mode uses `out` output from `npm run export`.

## Environment

Copy `.env.example` to `.env.local`.

API base URLs are public configuration in this project.

- `PRODUCT_API_BASE_URL`: product service base URL, for example `https://api.example.com/products`.
- `PAYMENT_API_BASE_URL`: payment service base URL, for example `https://api.example.com/payments`.
- `AUTH_API_BASE_URL`: auth service base URL, for example `https://api.example.com/auth`.
- `NEXT_API_BASE_URL` (optional): shared fallback base URL used by some legacy clients.

## Deployment Targets

- Static export: deploy the `out` directory to S3 + CloudFront
- SSR runtime: deploy the `.next` output and run `npm run start` on EC2

## Architecture Template

Use [ARCHITECTURE_TEMPLATE.md](ARCHITECTURE_TEMPLATE.md) as the baseline template when recreating this frontend.
