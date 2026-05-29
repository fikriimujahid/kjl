import { ROUTES } from "../src/routes";

describe("product routes", () => {
  it.each([
    ["GET_PRODUCTS", ROUTES.GET_PRODUCTS, "GET", "/api/products", "GET /api/products"],
    [
      "GET_PRODUCT_DETAIL",
      ROUTES.GET_PRODUCT_DETAIL,
      "GET",
      "/api/products/{id}",
      "GET /api/products/{id}"
    ],
    [
      "GET_INTERNAL_PRODUCT_SUMMARY",
      ROUTES.GET_INTERNAL_PRODUCT_SUMMARY,
      "GET",
      "/api/internal/products/{id}/summary",
      "GET /api/internal/products/{id}/summary"
    ],
    [
      "GET_INTERNAL_SESSION_BY_ID",
      ROUTES.GET_INTERNAL_SESSION_BY_ID,
      "GET",
      "/api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}",
      "GET /api/internal/products/{productId}/topics/{topicId}/sessions/{sessionId}"
    ]
  ])("keeps %s route contract", (_, route, method, path, routeKey) => {
    expect(route.method).toBe(method);
    expect(route.path).toBe(path);
    expect(route.routeKey).toBe(routeKey);
  });

  it("uses unique route keys for all endpoints", () => {
    const routeKeys = Object.values(ROUTES).map((route) => route.routeKey);
    const uniqueRouteKeys = new Set(routeKeys);

    expect(uniqueRouteKeys.size).toBe(routeKeys.length);
  });
});
