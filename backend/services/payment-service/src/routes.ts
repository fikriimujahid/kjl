export const ROUTES = {
  CREATE_PAYMENT: {
    method: "POST",
    path: "/api/payments/create",
    routeKey: "POST /api/payments/create",
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
