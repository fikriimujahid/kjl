import { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from "aws-lambda";
import { PaymentOrderRecord } from "../src/models/payment";

type CreatePaymentFn = (
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyStructuredResultV2>;

interface CreatePaymentMocks {
  getAuthenticatedUser: jest.Mock;
  parseEventBody: jest.Mock;
  hasActiveProductAccess: jest.Mock;
  fetchProductById: jest.Mock;
  createSnapTransaction: jest.Mock;
  savePaymentOrder: jest.Mock;
  randomUUID: jest.Mock;
}

const ORIGINAL_ENV = process.env;

const buildEvent = (): APIGatewayProxyEventV2 => ({
  version: "2.0",
  routeKey: "POST /api/payments/create",
  rawPath: "/api/payments/create",
  rawQueryString: "",
  headers: {},
  requestContext: {
    accountId: "test-account",
    apiId: "test-api",
    domainName: "localhost",
    domainPrefix: "localhost",
    http: {
      method: "POST",
      path: "/api/payments/create",
      protocol: "HTTP/1.1",
      sourceIp: "127.0.0.1",
      userAgent: "jest"
    },
    requestId: "req-create",
    routeKey: "POST /api/payments/create",
    stage: "$default",
    time: "13/May/2026:00:00:00 +0000",
    timeEpoch: Date.now()
  },
  isBase64Encoded: false
}) as APIGatewayProxyEventV2;

const parseBody = (response: APIGatewayProxyStructuredResultV2): Record<string, unknown> => {
  const body = JSON.parse(response.body ?? "{}") as Record<string, unknown>;

  if (body.success === true && typeof body.data === "object" && body.data != null) {
    return body.data as Record<string, unknown>;
  }

  if (body.success === false && typeof body.error === "object" && body.error != null) {
    const error = body.error as Record<string, unknown>;
    return {
      message: typeof error.message === "string" ? error.message : "",
      ...(typeof error.code === "string" ? { code: error.code } : {})
    };
  }

  return body;
};

const loadCreatePaymentModule = async (
  envOverrides: Record<string, string | undefined> = {}
): Promise<{ createPayment: CreatePaymentFn; mocks: CreatePaymentMocks }> => {
  jest.resetModules();

  process.env = {
    ...ORIGINAL_ENV,
    DYNAMO_DB_TABLE_NAME: "kjl-table",
    MIDTRANS_SERVER_KEY: "midtrans-server-key",
    MIDTRANS_SNAP_API_URL: "https://snap.example.com/transactions",
    APP_BASE_URL: "",
    PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.example.com",
    INTERNAL_SERVICE_API_KEY: "internal-secret"
  };

  for (const [key, value] of Object.entries(envOverrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const mocks: CreatePaymentMocks = {
    getAuthenticatedUser: jest.fn(),
    parseEventBody: jest.fn(),
    hasActiveProductAccess: jest.fn(),
    fetchProductById: jest.fn(),
    createSnapTransaction: jest.fn(),
    savePaymentOrder: jest.fn(),
    randomUUID: jest.fn().mockReturnValue("a1234567-89ab-cdef-0123-456789abcdef")
  };

  jest.doMock("crypto", () => ({
    ...jest.requireActual("crypto"),
    randomUUID: mocks.randomUUID
  }));

  jest.doMock("@shared-utils/auth", () => ({
    getAuthenticatedUser: mocks.getAuthenticatedUser
  }));

  jest.doMock("@shared-utils/request", () => ({
    parseEventBody: mocks.parseEventBody
  }));

  jest.doMock("../src/repositories/paymentOrderRepository", () => ({
    hasActiveProductAccess: mocks.hasActiveProductAccess,
    savePaymentOrder: mocks.savePaymentOrder
  }));

  jest.doMock("../src/repositories/productRepository", () => ({
    findProductById: mocks.fetchProductById
  }));

  jest.doMock("../src/services/midtransService", () => ({
    createSnapTransaction: mocks.createSnapTransaction
  }));

  const module = require("../src/handlers/createPaymentHandler") as {
    createPaymentHandler: CreatePaymentFn;
  };
  return { createPayment: module.createPaymentHandler as CreatePaymentFn, mocks };
};

describe("createPayment", () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns 500 when DYNAMO_DB_TABLE_NAME is missing", async () => {
    const { createPayment } = await loadCreatePaymentModule({ DYNAMO_DB_TABLE_NAME: undefined });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing DYNAMO_DB_TABLE_NAME environment variable"
    });
  });

  it("returns 500 when MIDTRANS_SERVER_KEY is missing", async () => {
    const { createPayment } = await loadCreatePaymentModule({ MIDTRANS_SERVER_KEY: undefined });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing MIDTRANS_SERVER_KEY environment variable"
    });
  });

  it("returns 500 when MIDTRANS_SNAP_API_URL is missing", async () => {
    const { createPayment } = await loadCreatePaymentModule({ MIDTRANS_SNAP_API_URL: undefined });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing MIDTRANS_SNAP_API_URL environment variable"
    });
  });

  it("returns 500 when PRODUCT_SERVICE_INTERNAL_API_BASE_URL is missing", async () => {
    const { createPayment } = await loadCreatePaymentModule({
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: undefined
    });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing PRODUCT_SERVICE_INTERNAL_API_BASE_URL environment variable"
    });
  });

  it("returns 500 when INTERNAL_SERVICE_API_KEY is missing", async () => {
    const { createPayment } = await loadCreatePaymentModule({ INTERNAL_SERVICE_API_KEY: undefined });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(500);
    expect(parseBody(response)).toEqual({
      message: "Missing INTERNAL_SERVICE_API_KEY environment variable"
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue(null);

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(401);
    expect(parseBody(response)).toEqual({ message: "Unauthorized" });
  });

  it("returns 400 when request body is invalid JSON", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockImplementation(() => {
      throw new Error("invalid");
    });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ message: "Invalid JSON body" });
  });

  it("returns 400 when productId is missing", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "   " });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ message: "productId is required" });
  });

  it("returns 409 when active access already exists", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(true);

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(409);
    expect(parseBody(response)).toEqual({ message: "User already has the product" });
    expect(mocks.fetchProductById).not.toHaveBeenCalled();
  });

  it("returns 502 when active access validation fails", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockRejectedValue(new Error("dynamo down"));

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to validate existing product access" });
  });

  it("returns 502 when product lookup fails", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockRejectedValue(new Error("network"));

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to load product data" });
  });

  it("returns 404 when product does not exist", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockResolvedValue(null);

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(404);
    expect(parseBody(response)).toEqual({ message: "Product not found" });
  });

  it("returns 400 when product price is not valid", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockResolvedValue({
      id: "product-1",
      name: "Starter",
      price: 0,
      accessDurationDays: 30
    });

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(400);
    expect(parseBody(response)).toEqual({ message: "Invalid product price" });
  });

  it("returns 502 when Midtrans rejects transaction creation", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockResolvedValue({
      id: "product-1",
      name: "Starter",
      price: 199999.7,
      accessDurationDays: 30
    });
    mocks.createSnapTransaction.mockRejectedValue(new Error("midtrans"));

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Midtrans rejected payment creation" });
  });

  it("returns 502 when saving order fails", async () => {
    const { createPayment, mocks } = await loadCreatePaymentModule();
    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "User" });
    mocks.parseEventBody.mockReturnValue({ productId: "product-1" });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockResolvedValue({
      id: "product-1",
      name: "Starter",
      price: 100000,
      accessDurationDays: 30
    });
    mocks.createSnapTransaction.mockResolvedValue({ token: "snap-token", redirectUrl: "https://pay.example/redirect" });
    mocks.savePaymentOrder.mockRejectedValue(new Error("write failed"));

    const response = await createPayment(buildEvent());

    expect(response.statusCode).toBe(502);
    expect(parseBody(response)).toEqual({ message: "Failed to persist payment order" });
  });

  it("creates payment successfully and persists order", async () => {
    const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1715550000000);
    const { createPayment, mocks } = await loadCreatePaymentModule({ APP_BASE_URL: "https://app.kjl.test/" });

    mocks.getAuthenticatedUser.mockReturnValue({ id: "user-1", email: "user@example.com", name: "" });
    mocks.parseEventBody.mockReturnValue({ productId: " product-1 " });
    mocks.hasActiveProductAccess.mockResolvedValue(false);
    mocks.fetchProductById.mockResolvedValue({
      id: "product-1",
      name: "Starter",
      price: 199999.49,
      accessDurationDays: 45
    });
    mocks.createSnapTransaction.mockResolvedValue({ token: "snap-token", redirectUrl: "https://pay.example/redirect" });
    mocks.savePaymentOrder.mockResolvedValue(undefined);

    const response = await createPayment(buildEvent());
    const body = parseBody(response);
    const expectedOrderId = `KJL~user-1~${(1715550000000).toString(36)}a`;

    expect(response.statusCode).toBe(200);
    expect(body).toEqual({
      orderId: expectedOrderId,
      snapToken: "snap-token",
      redirectUrl: "https://pay.example/redirect"
    });
    expect(expectedOrderId.length).toBeLessThanOrEqual(50);

    expect(mocks.hasActiveProductAccess).toHaveBeenCalledWith("user-1", "product-1");
    expect(mocks.fetchProductById).toHaveBeenCalledWith("product-1");
    expect(mocks.createSnapTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        serverKey: "midtrans-server-key",
        snapApiUrl: "https://snap.example.com/transactions",
        payload: expect.objectContaining({
          transaction_details: {
            order_id: expectedOrderId,
            gross_amount: 199999
          },
          item_details: [
            {
              id: "product-1",
              name: "Starter",
              price: 199999,
              quantity: 1
            }
          ],
          customer_details: {
            first_name: "user@example.com",
            email: "user@example.com"
          },
          callbacks: {
            finish: "https://app.kjl.test/payment-success",
            error: "https://app.kjl.test/payment-failed",
            pending: "https://app.kjl.test/payment-success?pending=1"
          }
        })
      })
    );

    expect(mocks.savePaymentOrder).toHaveBeenCalledWith(
      "kjl-table",
      expect.objectContaining<Partial<PaymentOrderRecord>>({
        PK: "PAYMENT#user-1",
        SK: `PAYMENT#${expectedOrderId}`,
        orderId: expectedOrderId,
        userId: "user-1",
        productId: "product-1",
        amount: 199999,
        grossAmount: "199999.00",
        accessDurationDays: 45,
        snapRedirectUrl: "https://pay.example/redirect",
        status: "CREATED"
      })
    );

    nowSpy.mockRestore();
  });
});
