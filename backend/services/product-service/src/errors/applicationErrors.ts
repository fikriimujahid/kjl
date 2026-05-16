export class ProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ProductNotFoundError";
  }
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthenticationRequiredError";
  }
}

export class ForbiddenProductAccessError extends Error {
  constructor() {
    super("Forbidden");
    this.name = "ForbiddenProductAccessError";
  }
}