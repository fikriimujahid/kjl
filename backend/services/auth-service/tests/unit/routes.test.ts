import { ROUTES } from "../../src/routes";

describe("auth routes", () => {
  it("keeps the login route contract", () => {
    expect(ROUTES.LOGIN.routeKey).toBe("POST /api/auth/login");
    expect(ROUTES.LOGIN.path).toBe("/api/auth/login");
    expect(ROUTES.LOGIN.method).toBe("POST");
  });

  it("keeps the session route contract", () => {
    expect(ROUTES.SESSION.routeKey).toBe("GET /api/auth/session");
    expect(ROUTES.SESSION.path).toBe("/api/auth/session");
    expect(ROUTES.SESSION.method).toBe("GET");
  });
});
