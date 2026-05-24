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

export class SessionQuestionsNotFoundError extends Error {
  constructor() {
    super("Session questions not found");
    this.name = "SessionQuestionsNotFoundError";
  }
}

export class InvalidSessionQuestionsPayloadError extends Error {
  constructor() {
    super("Session questions payload is invalid");
    this.name = "InvalidSessionQuestionsPayloadError";
  }
}

export class SessionAnswersNotFoundError extends Error {
  constructor() {
    super("Session answers not found");
    this.name = "SessionAnswersNotFoundError";
  }
}

export class InvalidSessionAnswersPayloadError extends Error {
  constructor() {
    super("Session answers payload is invalid");
    this.name = "InvalidSessionAnswersPayloadError";
  }
}

export class SessionAnswerNotFoundError extends Error {
  constructor(questionId: string) {
    super(`Answer key not found for question: ${questionId}`);
    this.name = "SessionAnswerNotFoundError";
  }
}

export class SessionAttemptNotFoundError extends Error {
  constructor(attemptId: string) {
    super(`Session attempt not found: ${attemptId}`);
    this.name = "SessionAttemptNotFoundError";
  }
}

export class SessionAttemptAlreadyFinishedError extends Error {
  constructor(attemptId: string) {
    super(`Session attempt already finished: ${attemptId}`);
    this.name = "SessionAttemptAlreadyFinishedError";
  }
}
