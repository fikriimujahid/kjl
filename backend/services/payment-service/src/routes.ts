export const ROUTES = {
  CREATE_PAYMENT: {
    method: "POST",
    path: "/api/payments/create",
    routeKey: "POST /api/payments/create",
  },
  HANDLE_WEBHOOK: {
    method: "POST",
    path: "/api/payments/webhook",
    routeKey: "POST /api/payments/webhook",
  },
} as const;
