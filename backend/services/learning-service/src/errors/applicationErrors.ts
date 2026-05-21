export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenLearningContentAccessError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenLearningContentAccessError";
  }
}

export class SessionNotFoundError extends Error {
  constructor() {
    super("Session not found");
    this.name = "SessionNotFoundError";
  }
}

export class UnsupportedSessionTypeError extends Error {
  constructor(sessionType: string) {
    super(`Unsupported session type: ${sessionType}`);
    this.name = "UnsupportedSessionTypeError";
  }
}
