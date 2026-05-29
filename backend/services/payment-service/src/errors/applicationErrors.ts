export class ApplicationError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, statusCode = 400) {
    super(message, statusCode);
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string) {
    super(message, 401);
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string) {
    super(message, 403);
  }
}

export class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(message: string) {
    super(message, 502);
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string) {
    super(message, 409);
  }
}