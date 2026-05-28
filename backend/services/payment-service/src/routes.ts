export const ROUTES = {
  CREATE_PAYMENT: {
    method: "POST",
    path: "/api/payments/create",
    routeKey: "POST /api/payments/create",
  },
  GET_OWNED_PRODUCTS: {
    method: "GET",
    path: "/api/payments/owned/{userId}",
    routeKey: "GET /api/payments/owned/{userId}",
  },
  GET_INTERNAL_OWNED_PRODUCTS: {
    method: "GET",
    path: "/api/internal/payments/owned/{userId}",
    routeKey: "GET /api/internal/payments/owned/{userId}",
  },
  GET_PAYMENT_HISTORY: {
    method: "GET",
    path: "/api/payments/history",
    routeKey: "GET /api/payments/history",
  },
  HANDLE_WEBHOOK: {
    method: "POST",
    path: "/api/payments/webhook",
    routeKey: "POST /api/payments/webhook",
  },
} as const;
