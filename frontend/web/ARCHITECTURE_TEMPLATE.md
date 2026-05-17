# Frontend Architecture Template (Dual Mode: Static + SSR)

This template is the default baseline for rebuilding this frontend with these goals:

- Simple to understand for junior developers
- Easy to maintain and evolve
- Secure by default
- Compatible with both static export (S3 + CloudFront) and SSR runtime

## 1) Folder Structure

Use this structure as the default.

```text
src/
  app/
    layout.tsx
    page.tsx
    (public)/
      products/
      login/
      register/
      forgot-password/
    (protected)/
      dashboard/
      course/
      profile/
  features/
    auth/
      api/
      hooks/
      providers/
      ui/
      model/
      index.ts
    products/
      api/
      hooks/
      ui/
      model/
      index.ts
    dashboard/
      api/
      hooks/
      ui/
      model/
      index.ts
    learning/
      api/
      hooks/
      ui/
      model/
      index.ts
  shared/
    ui/
    lib/
    utils/
  core/
    env/
    http/
    security/
  reference/
    my-learning/
      MyLearningPage.reference.tsx
```

## 2) Ownership Rules

Keep these rules strict:

1. app only composes pages and route-level layout.
2. features contain business logic.
3. shared contains reusable and domain-agnostic code only.
4. core contains cross-cutting runtime concerns (env, http, security).
5. reference is read-only historical code and is not used by production routes.

## 3) File Size Guidance

Simple limits reduce complexity quickly:

- Route files in app: target <= 40 lines
- Hooks/services/components: split when file exceeds ~150 lines
- Avoid commented dead code; remove it and rely on git history

## 4) Data and API Conventions

- Keep one API layer per feature (for example features/products/api).
- Use consistent response parsing helpers from core/http.
- Do not duplicate domain models in multiple places.
- Keep API base URLs in environment configuration.

Public env variables used by this frontend:

- PRODUCT_API_BASE_URL
- PAYMENT_API_BASE_URL
- AUTH_API_BASE_URL
- NEXT_API_BASE_URL (optional fallback)

## 5) Auth and Route Protection

- Keep auth state in one provider and expose a single hook.
- Use one RequireAuth guard for protected screens.
- Prefer cookie-based sessions for refresh/logout flows where possible.
- Never store sensitive secrets in frontend env values.

## 6) Security Baseline

For static deploys (S3 + CloudFront):

1. Add CloudFront security headers policy:
   - Content-Security-Policy
   - Strict-Transport-Security
   - X-Content-Type-Options
   - Referrer-Policy
   - Permissions-Policy
2. Restrict frame/embed origins if iframe content is used.
3. Validate and allowlist remote content URLs before embedding.
4. Keep dependency and SAST scans in CI.

## 7) Dual-Mode Runtime Notes

- SSR build path: npm run build, then npm run start
- Static build path: npm run export, deploy out/ to S3 + CloudFront
- Ensure static mode does not depend on request-only server features

## 8) Junior Onboarding Checklist

1. Start from this folder template.
2. Add a new feature under features/<name> with api/hooks/ui/model.
3. Keep route files small and delegate logic to feature hooks.
4. Add at least one test for each new critical hook or parser.
5. Update README env section if new public config is introduced.

## 9) What Not To Do

- Do not place business logic directly in app route files.
- Do not create duplicate type systems for the same domain.
- Do not keep large commented blocks in active files.
- Do not mix reference code with production feature code.
