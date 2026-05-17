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
      "GET_INTERNAL_OWNED_PRODUCTS",
      ROUTES.GET_INTERNAL_OWNED_PRODUCTS,
      "GET",
      "/api/internal/products/owned/{userId}",
      "GET /api/internal/products/owned/{userId}"
    ],
    [
      "GET_INTERNAL_PRODUCT_EXISTS",
      ROUTES.GET_INTERNAL_PRODUCT_EXISTS,
      "GET",
      "/api/internal/products/{id}/exists",
      "GET /api/internal/products/{id}/exists"
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
