export const ROUTES = {
  GET_SESSION_IMAGES: {
    method: "GET",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images",
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images"
  }
} as const;
