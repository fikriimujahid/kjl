import { ROUTES } from "../src/routes";

describe("payment routes", () => {
  it.each([
    ["CREATE_PAYMENT", ROUTES.CREATE_PAYMENT, "POST", "/api/payments/create", "POST /api/payments/create"],
    ["GET_OWNED_PRODUCTS", ROUTES.GET_OWNED_PRODUCTS, "GET", "/api/payments/owned/{userId}", "GET /api/payments/owned/{userId}"],
    ["GET_INTERNAL_OWNED_PRODUCTS", ROUTES.GET_INTERNAL_OWNED_PRODUCTS, "GET", "/api/internal/payments/owned/{userId}", "GET /api/internal/payments/owned/{userId}"],
    ["GET_PAYMENT_HISTORY", ROUTES.GET_PAYMENT_HISTORY, "GET", "/api/payments/history", "GET /api/payments/history"],
    ["HANDLE_WEBHOOK", ROUTES.HANDLE_WEBHOOK, "POST", "/api/payments/webhook", "POST /api/payments/webhook"]
  ])("keeps %s route contract", (_, route, method, path, routeKey) => {
    expect(route.method).toBe(method);
    expect(route.path).toBe(path);
    expect(route.routeKey).toBe(routeKey);
  });

  it("uses unique route keys", () => {
    const routeKeys = Object.values(ROUTES).map((route) => route.routeKey);
    expect(new Set(routeKeys).size).toBe(routeKeys.length);
  });
});
