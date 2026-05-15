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
  GET_PRODUCT_SESSION_DETAIL: {
    method: "GET",
    path: "/api/products/{productId}/topics/{topicId}/sessions/{sessionId}",
    routeKey: "GET /api/products/{productId}/topics/{topicId}/sessions/{sessionId}",
  },
  
  GET_PURCHASED_PRODUCT_DETAIL: {
    method: "GET",
    path: "/api/purchased-product/{userId}/product/{productId}",
    routeKey: "GET /api/purchased-product/{userId}/product/{productId}",
  },
} as const;
