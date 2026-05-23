export const ROUTES = {
  GET_SESSION_IMAGES: {
    method: "GET",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images",
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/images"
  },
  GET_SESSION_QUESTIONS: {
    method: "GET",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions",
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/questions"
  },
  CHECK_SESSION_ANSWER: {
    method: "POST",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check",
    routeKey: "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/answers/check"
  },
  START_SESSION_ATTEMPT: {
    method: "POST",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start",
    routeKey: "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/start"
  },
  GET_SESSION_ATTEMPTS: {
    method: "GET",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts",
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts"
  },
  FINISH_SESSION_ATTEMPT: {
    method: "POST",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish",
    routeKey: "POST /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/finish"
  },
  GET_SESSION_ATTEMPT_PROGRESS: {
    method: "GET",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress",
    routeKey: "GET /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
  },
  SAVE_SESSION_ATTEMPT_PROGRESS: {
    method: "PUT",
    path: "/api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress",
    routeKey: "PUT /api/learning/products/{productId}/topics/{topicId}/sessions/{sessionId}/attempts/{attemptId}/progress"
  }
} as const;
