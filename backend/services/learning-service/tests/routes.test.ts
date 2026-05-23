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

  it("keeps START_SESSION_ATTEMPT route contract", () => {
    expect(ROUTES.START_SESSION_ATTEMPT.method).toBe("POST");
    expect(ROUTES.START_SESSION_ATTEMPT.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start"
    );
    expect(ROUTES.START_SESSION_ATTEMPT.routeKey).toBe(
      "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start"
    );
  });

  it("keeps GET_SESSION_ATTEMPTS route contract", () => {
    expect(ROUTES.GET_SESSION_ATTEMPTS.method).toBe("GET");
    expect(ROUTES.GET_SESSION_ATTEMPTS.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts"
    );
    expect(ROUTES.GET_SESSION_ATTEMPTS.routeKey).toBe(
      "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts"
    );
  });

  it("keeps FINISH_SESSION_ATTEMPT route contract", () => {
    expect(ROUTES.FINISH_SESSION_ATTEMPT.method).toBe("POST");
    expect(ROUTES.FINISH_SESSION_ATTEMPT.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish"
    );
    expect(ROUTES.FINISH_SESSION_ATTEMPT.routeKey).toBe(
      "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish"
    );
  });

  it("keeps GET_SESSION_ATTEMPT_PROGRESS route contract", () => {
    expect(ROUTES.GET_SESSION_ATTEMPT_PROGRESS.method).toBe("GET");
    expect(ROUTES.GET_SESSION_ATTEMPT_PROGRESS.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
    );
    expect(ROUTES.GET_SESSION_ATTEMPT_PROGRESS.routeKey).toBe(
      "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
    );
  });

  it("keeps SAVE_SESSION_ATTEMPT_PROGRESS route contract", () => {
    expect(ROUTES.SAVE_SESSION_ATTEMPT_PROGRESS.method).toBe("PUT");
    expect(ROUTES.SAVE_SESSION_ATTEMPT_PROGRESS.path).toBe(
      "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
    );
    expect(ROUTES.SAVE_SESSION_ATTEMPT_PROGRESS.routeKey).toBe(
      "PUT /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
    );
  });

  it("uses unique route keys", () => {
    const routeKeys = Object.values(ROUTES).map((route) => route.routeKey);
    const uniqueRouteKeys = new Set(routeKeys);

    expect(uniqueRouteKeys.size).toBe(routeKeys.length);
  });
});
