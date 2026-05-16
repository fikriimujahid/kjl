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
  GET_OWNED_PRODUCTS: {
    method: "GET",
    path: "/api/products/owned/{userId}",
    routeKey: "GET /api/products/owned/{userId}",
  },
  GET_INTERNAL_OWNED_PRODUCTS: {
    method: "GET",
    path: "/api/internal/products/owned/{userId}",
    routeKey: "GET /api/internal/products/owned/{userId}",
  }
} as const;
