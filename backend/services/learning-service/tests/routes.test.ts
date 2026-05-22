import { ROUTES } from "../src/routes";

describe("learning routes", () => {
  it("keeps GET_SESSION_IMAGES route contract", () => {
    expect(ROUTES.GET_SESSION_IMAGES.method).toBe("GET");
    expect(ROUTES.GET_SESSION_IMAGES.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images"
    );
    expect(ROUTES.GET_SESSION_IMAGES.routeKey).toBe(
      "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images"
    );
  });

  it("keeps GET_SESSION_QUESTIONS route contract", () => {
    expect(ROUTES.GET_SESSION_QUESTIONS.method).toBe("GET");
    expect(ROUTES.GET_SESSION_QUESTIONS.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions"
    );
    expect(ROUTES.GET_SESSION_QUESTIONS.routeKey).toBe(
      "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions"
    );
  });

  it("keeps CHECK_SESSION_ANSWER route contract", () => {
    expect(ROUTES.CHECK_SESSION_ANSWER.method).toBe("POST");
    expect(ROUTES.CHECK_SESSION_ANSWER.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check"
    );
    expect(ROUTES.CHECK_SESSION_ANSWER.routeKey).toBe(
      "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check"
    );
  });

  it("uses unique route keys", () => {
    const routeKeys = Object.values(ROUTES).map((route) => route.routeKey);
    const uniqueRouteKeys = new Set(routeKeys);

    expect(uniqueRouteKeys.size).toBe(routeKeys.length);
  });
});
