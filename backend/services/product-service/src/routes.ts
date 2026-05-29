export const ROUTES = {
  GET_PRODUCTS: {
    method: "GET",
    path: "/api/products",
    routeKey: "GET /api/products",
  },
  GET_PRODUCT_DETAIL: {
    method: "GET",
    path: "/api/products/{id}",
    routeKey: "GET /api/products/{id}",
  },
  GET_INTERNAL_PRODUCT_SUMMARY: {
    method: "GET",
    path: "/api/internal/products/{id}/summary",
    routeKey: "GET /api/internal/products/{id}/summary",
  },
  GET_INTERNAL_SESSION_BY_ID: {
    method: "GET",
    path: "/api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}",
    routeKey: "GET /api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}",
  }
} as const;
