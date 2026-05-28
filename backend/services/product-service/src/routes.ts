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
  }
} as const;
