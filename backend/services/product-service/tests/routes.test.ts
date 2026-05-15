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
      "GET_OWNED_PRODUCTS",
      ROUTES.GET_OWNED_PRODUCTS,
      "GET",
      "/api/products/owned/{userId}",
      "GET /api/products/owned/{userId}"
    ],
    [
      "GET_PRODUCT_SESSION_DETAIL",
      ROUTES.GET_PRODUCT_SESSION_DETAIL,
      "GET",
      "/api/products/{productId}/topics/{topicId}/sessions/{sessionId}",
      "GET /api/products/{productId}/topics/{topicId}/sessions/{sessionId}"
    ],
    [
      "GET_PURCHASED_PRODUCT_DETAIL",
      ROUTES.GET_PURCHASED_PRODUCT_DETAIL,
      "GET",
      "/api/purchased-product/{userId}/product/{productId}",
      "GET /api/purchased-product/{userId}/product/{productId}"
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
