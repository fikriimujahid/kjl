# Frontend Architecture Template (Dual Mode: Static + SSR)

This template reflects the current production implementation and is the baseline for all new pages, features, and components.

Goals:
- Simple to understand for junior developers
- Easy to maintain and evolve
- Secure by default
- Compatible with both static export (S3 + CloudFront) and SSR runtime

## 1) Folder Structure

```text
src/
  app/
    layout.tsx                        # Root layout: AuthProvider + Navbar + Footer
    not-found.tsx                     # Global 404 page
    globals.css
    (public)/
      page.tsx                        # Home page
      login/
        page.tsx
      register/
        page.tsx
      forgot-password/
        page.tsx
      products/
        page.tsx                      # Thin router: dispatches to ProductsPage or ProductDetailPage
        ProductsPage.tsx              # Page-level component
        ProductDetailPage.tsx         # Page-level component
      faq/
        page.tsx
      payment-success/
        page.tsx
      payment-failed/
        page.tsx
    (protected)/
      dashboard/
        page.tsx                      # Wraps DashboardPage with RequireAuth
      profile/
        page.tsx
  components/
    auth/
      RequireAuth.tsx                 # Route guard component
    navbar/
      Navbar.tsx
      DesktopNav.tsx
      MobileNav.tsx
      MobileMenuButton.tsx
      UserMenu.tsx
    home/
      HeroSection.tsx
      FeaturedProductsSection.tsx
      FeaturesSection.tsx
      HowItWorksSection.tsx
      TestimonialsSection.tsx
      CTASection.tsx
    products/
      ProductCard.tsx
      ProductCardSkeleton.tsx
      ProductsFilters.tsx
      ProductsResults.tsx
      detail/                         # Sub-folder for complex multi-component domains
        ProductOverviewPanel.tsx
        ProductTopicsSection.tsx
        ProductDetailSkeleton.tsx
        ProductDetailNotFound.tsx
        AlreadyOwnedModal.tsx
        PaymentErrorModal.tsx
        SessionTypeIcon.tsx
    dashboard/
      ActivityChart.tsx
      MotivationCard.tsx
      OwnedProducts.tsx
      WordOfDayCard.tsx
    course/
      ImageViewer.tsx
    Footer.tsx
  hooks/
    useAuth.ts                        # Reads from AuthContext via useContext
    useProducts.ts
    useProductDetail.ts
    useOwnedProducts.ts
    useProductPurchase.ts
    useCourseDetail.ts
  services/
    auth/
      loginApi.ts
      logoutApi.ts
      registerApi.ts
      passwordResetApi.ts
      refresh.ts
      refreshScheduler.ts
      session.ts
      token.ts
    products/
      productsApi.ts
    payments/
      paymentsApi.ts
    learning/
      learningApi.ts
  providers/
    AuthProvider.tsx                  # Creates AuthContext, manages auth state
  types/
    index.ts                          # Shared / generic types (User, Option, Question, etc.)
    auth.ts
    product.ts
    payment.ts
    dashboard.ts
    nav-bar.ts
    global.d.ts
  lib/
    api/
      client.ts                       # Low-level fetch helpers: postJson, getJson
      response.ts                     # Response parsers: readErrorMessage, readSuccessData, extractSuccessData
  utils/
    classnames.ts                     # cn() helper (clsx + tailwind-merge)
    formatters.ts
    products.ts
    typeGuards.ts
    dashboard.ts
  constants/
    auth.ts
    products.ts
    dashboard.ts
```

## 2) Ownership Rules

1. `app/` — thin route files only. Delegates rendering to page-level components. Target ≤ 40 lines per `page.tsx`.
2. `app/(public)/` — routes accessible without authentication.
3. `app/(protected)/` — routes that require login; wrap content with `<RequireAuth>`.
4. `components/<domain>/` — UI rendering only, no direct API calls. Use hooks for data.
5. `hooks/` — data fetching, state, and side effects. One hook per file.
6. `services/<domain>/` — raw API call functions. No React state inside.
7. `providers/` — React context creation and state management.
8. `types/` — TypeScript interfaces and types. One file per domain.
9. `lib/api/` — low-level HTTP primitives shared by all services.
10. `utils/` — pure utility functions with no side effects.
11. `constants/` — static data and configuration values.

## 3) Naming Conventions

| Layer | Pattern | Example |
|---|---|---|
| Route file | `page.tsx` | `app/(public)/login/page.tsx` |
| Page component | `<Domain>Page.tsx` | `ProductsPage.tsx`, `ProductDetailPage.tsx` |
| UI component | `PascalCase.tsx` | `ProductCard.tsx`, `OwnedProducts.tsx` |
| Hook | `use<Domain><Feature>.ts` | `useProductDetail.ts`, `useOwnedProducts.ts` |
| Service file | `<domain>Api.ts` | `productsApi.ts`, `loginApi.ts` |
| Provider | `<Name>Provider.tsx` | `AuthProvider.tsx` |
| Types file | `<domain>.ts` | `product.ts`, `auth.ts` |
| Constants file | `<domain>.ts` | `products.ts`, `dashboard.ts` |

## 4) Adding a New Page

For a public page (example: `/faq`):

1. Create `app/(public)/faq/page.tsx` — thin, ≤ 40 lines.
2. If the page has significant UI, create `app/(public)/faq/FaqPage.tsx` and import it from `page.tsx`.
3. Add UI sections to `components/faq/`.
4. Add data hooks to `hooks/useFaq.ts`.
5. Add API calls to `services/faq/faqApi.ts`.
6. Add types to `types/faq.ts`.
7. Add constants to `constants/faq.ts` if needed.

For a protected page (example: `/settings`):

1. Create `app/(protected)/settings/page.tsx`.
2. Wrap the root element with `<RequireAuth>`.
3. Use `const { status, user, accessToken } = useAuth()` for auth context.
4. Follow the same steps 2–7 as above.

## 5) Page Component Pattern

`page.tsx` must be thin and delegate to a named page component:

```tsx
// app/(public)/products/page.tsx
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProductDetailPage } from './ProductDetailPage';
import ProductsPage from './ProductsPage';

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId')?.trim();

  if (productId) {
    return <ProductDetailPage productId={productId} />;
  }

  return <ProductsPage />;
}

export default function Page() {
  return (
    <Suspense fallback={<div />}>
      <ProductsPageContent />
    </Suspense>
  );
}
```

Always wrap `useSearchParams()` in `<Suspense>` — required for static export builds.

Protected page pattern:

```tsx
// app/(protected)/dashboard/page.tsx
'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import DashboardPage from './DashboardPage';

export default function Page() {
  return (
    <RequireAuth>
      <DashboardPage />
    </RequireAuth>
  );
}
```

## 6) Hook Pattern

One hook per file. Use `AbortController` for async cleanup:

```ts
// hooks/useProducts.ts
'use client';

import { useEffect, useState } from 'react';
import type { Product } from '@/types/product';
import { fetchProducts } from '@/services/products/productsApi';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const data = await fetchProducts({ signal: controller.signal });
        if (!controller.signal.aborted) setProducts(data);
      } catch {
        if (!controller.signal.aborted) setError('Failed to load');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  return { products, loading, error };
}
```

## 7) Service Pattern

Service files call the backend directly. Use `lib/api/response.ts` helpers to parse responses:

```ts
// services/products/productsApi.ts
import { readSuccessData, readErrorMessage } from '@/lib/api/response';
import type { Product } from '@/types/product';

const BASE = (process.env.PRODUCT_API_BASE_URL ?? '/api').replace(/\/+$/, '');

interface FetchOptions {
  signal?: AbortSignal;
  cache?: RequestCache;
}

export async function fetchProducts(options: FetchOptions = {}): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`, {
    signal: options.signal,
    cache: options.cache ?? 'no-store',
  });

  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }

  return readSuccessData<Product[]>(res);
}
```

## 8) Auth Integration

Auth state flows through one chain:

```
AuthProvider  →  AuthContext  →  useAuth()  →  components / pages
```

- `providers/AuthProvider.tsx` creates `AuthContext` and owns session state.
- `hooks/useAuth.ts` is the only way components read auth state.
- `components/auth/RequireAuth.tsx` redirects unauthenticated users to `/login?next=<path>`.
- Services that need the access token accept it as a parameter — they do not read context directly.

```ts
// hooks/useAuth.ts — always use this; never read AuthContext directly in components
'use client';
import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

## 9) Data and API Conventions

- One service file per domain (e.g., `services/products/productsApi.ts`).
- Use `lib/api/client.ts` (`postJson`, `getJson`) for auth-related API calls with `credentials: 'include'`.
- Use `lib/api/response.ts` (`readErrorMessage`, `readSuccessData`) to parse all API responses uniformly.
- Keep API base URLs in environment variables, not hardcoded.
- Default `cache: 'no-store'` for data fetches to prevent stale production responses.

Environment variables used by this frontend:

| Variable | Purpose |
|---|---|
| `PRODUCT_API_BASE_URL` | Product service base URL (server-side) |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL exposed to the browser |
| `NEXT_PUBLIC_PRODUCT_URL` | Public product catalog URL |
| `AUTH_API_BASE_URL` | Auth service base URL |
| `PAYMENT_API_BASE_URL` | Payment service base URL |

## 10) Security Baseline

For static deploys (S3 + CloudFront):

1. Add CloudFront security headers policy:
   - `Content-Security-Policy`
   - `Strict-Transport-Security`
   - `X-Content-Type-Options`
   - `Referrer-Policy`
   - `Permissions-Policy`
2. Restrict frame/embed origins if iframe content is used.
3. Validate and allowlist remote content URLs before embedding.
4. Keep dependency and SAST scans in CI.
5. Never expose server-side secrets in `NEXT_PUBLIC_*` variables.
6. Sanitize the `?next=` redirect parameter on login — reject paths that don't start with `/` or start with `//`.

## 11) Static Export Rules

- Build: `npm run export` → deploys `out/` to S3 + CloudFront.
- Dynamic routes must define `generateStaticParams()` and set `dynamicParams = false`.
- Never use `headers()`, `cookies()`, or other request-only Next.js APIs in static routes.
- Wrap any component using `useSearchParams()` in `<Suspense>`.
- Do not use `useSearchParams()` in shared layout components (e.g., Navbar) — it can break unrelated static pages.
- CloudFront needs a viewer-request rewrite to map `/path` → `/path/index.html` for directory-style S3 routes.

## 12) Dual-Mode Runtime Notes

- SSR build: `npm run build`, then `npm run start`
- Static build: `npm run export`, sync `out/` to S3 + CloudFront
- `NEXT_OUTPUT_MODE=export` enables static output in `next.config.ts`; omitting it defaults to `.next` (SSR)

## 13) File Size Guidance

- `page.tsx` route files: target ≤ 40 lines
- Hooks / services / components: split when file exceeds ~150 lines
- Use a `detail/` sub-folder inside `components/<domain>/` when a domain needs more than ~4 components
- Remove commented dead code; rely on git history instead

## 14) Junior Onboarding Checklist

1. Add the route under `app/(public)/` or `app/(protected)/`.
2. Create a `<Name>Page.tsx` in the same folder for the page's main content.
3. Add UI components under `components/<domain>/`.
4. Add data hooks under `hooks/use<Domain>.ts`.
5. Add API calls under `services/<domain>/<domain>Api.ts`.
6. Add types under `types/<domain>.ts`.
7. Add static data under `constants/<domain>.ts` if needed.
8. For protected routes, wrap with `<RequireAuth>` and read auth via `useAuth()`.
9. Add at least one test for each new critical hook or parser.
10. Update this section if new public env variables are introduced.

## 15) What Not To Do

- Do not put business logic directly in `page.tsx` route files.
- Do not call APIs or fetch data inside components — use hooks.
- Do not read `AuthContext` directly in components — use `useAuth()`.
- Do not create duplicate type definitions for the same domain.
- Do not store server secrets in `NEXT_PUBLIC_*` variables.
- Do not use `useSearchParams()` outside a `<Suspense>` boundary.
- Do not use `useSearchParams()` in shared layout components like Navbar.
- Do not keep large commented blocks in active files.
