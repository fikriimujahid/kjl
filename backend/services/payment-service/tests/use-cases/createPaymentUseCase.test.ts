import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError
} from "../../src/errors/applicationErrors";
import { createPayment } from "../../src/use-cases/createPayment";
import { generatePaymentOrderId } from "../../src/domain/payment/generatePaymentOrderId";
import { buildSnapPayload } from "../../src/services/midtrans/buildSnapPayload";
import { createSnapTransaction } from "../../src/services/midtransService";
import { hasActiveProductAccess, savePaymentOrder } from "../../src/repositories/paymentOrderRepository";
import {
  getProductDetailById,
  getProductExistsById
} from "../../src/services/productServiceInternalClient";
import { createLogger } from "@shared-utils/logger";

jest.mock("../../src/repositories/paymentOrderRepository", () => ({
  hasActiveProductAccess: jest.fn(),
  savePaymentOrder: jest.fn()
}));

jest.mock("../../src/services/productServiceInternalClient", () => ({
  getProductDetailById: jest.fn(),
  getProductExistsById: jest.fn()
}));

jest.mock("../../src/services/midtransService", () => ({
  createSnapTransaction: jest.fn()
}));

jest.mock("../../src/services/midtrans/buildSnapPayload", () => ({
  buildSnapPayload: jest.fn()
}));

jest.mock("../../src/domain/payment/generatePaymentOrderId", () => ({
  generatePaymentOrderId: jest.fn()
}));

jest.mock("@shared-utils/logger", () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn()
  }))
}));

describe("createPayment", () => {
  const hasActiveProductAccessMock = hasActiveProductAccess as jest.MockedFunction<typeof hasActiveProductAccess>;
  const getProductDetailByIdMock = getProductDetailById as jest.MockedFunction<typeof getProductDetailById>;
  const getProductExistsByIdMock = getProductExistsById as jest.MockedFunction<typeof getProductExistsById>;
  const createSnapTransactionMock = createSnapTransaction as jest.MockedFunction<typeof createSnapTransaction>;
  const savePaymentOrderMock = savePaymentOrder as jest.MockedFunction<typeof savePaymentOrder>;
  const generatePaymentOrderIdMock = generatePaymentOrderId as jest.MockedFunction<typeof generatePaymentOrderId>;
  const buildSnapPayloadMock = buildSnapPayload as jest.MockedFunction<typeof buildSnapPayload>;
  const loggerErrorMock = ((createLogger as jest.Mock).mock.results[0]?.value?.error ??
    jest.fn()) as jest.Mock;

  const input = {
    env: {
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://snap.midtrans.test",
      APP_BASE_URL: "https://app.kjl.test",
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test",
      INTERNAL_SERVICE_API_KEY: "internal-secret"
    },
    authenticatedUser: {
      id: "user-1",
      email: "user@example.com",
      name: "Demo User"
    },
    productId: "product-1"
  };

  const product = {
    id: "product-1",
    name: "Starter Pack",
    price: 199999.49,
    accessDurationDays: 30
  };

  beforeEach(() => {
    jest.clearAllMocks();

    hasActiveProductAccessMock.mockResolvedValue(false);
    getProductExistsByIdMock.mockResolvedValue(true);
  getProductDetailByIdMock.mockResolvedValue(product);
    generatePaymentOrderIdMock.mockReturnValue("KJL~user-1~abc123");
    buildSnapPayloadMock.mockReturnValue({ transaction_details: { order_id: "KJL~user-1~abc123" } });
    createSnapTransactionMock.mockResolvedValue({ token: "snap-token", redirectUrl: "https://pay.example/redirect" });
    savePaymentOrderMock.mockResolvedValue(undefined);
  });

  it("throws ConflictError when user already has active product access", async () => {
    hasActiveProductAccessMock.mockResolvedValue(true);

    await expect(createPayment(input)).rejects.toBeInstanceOf(ConflictError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "User already has the product",
      statusCode: 409
    });

    expect(getProductExistsByIdMock).not.toHaveBeenCalled();
  });

  it("throws ExternalServiceError when active access check fails", async () => {
    hasActiveProductAccessMock.mockRejectedValue(new Error("dynamo down"));

    await expect(createPayment(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Failed to validate existing product access",
      statusCode: 502
    });
  });

  it("throws ExternalServiceError when product existence check fails", async () => {
    getProductExistsByIdMock.mockRejectedValue(new Error("network error"));

    await expect(createPayment(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Failed to validate product existence",
      statusCode: 502
    });
  });

  it("throws NotFoundError when product does not exist", async () => {
    getProductExistsByIdMock.mockResolvedValue(false);

    await expect(createPayment(input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Product not found",
      statusCode: 404
    });
  });

  it("throws ExternalServiceError when product lookup fails", async () => {
    getProductDetailByIdMock.mockRejectedValue(new Error("network error"));

    await expect(createPayment(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Failed to load product data",
      statusCode: 502
    });
  });

  it("throws NotFoundError when product metadata is missing after existence check", async () => {
    getProductDetailByIdMock.mockResolvedValue(null);

    await expect(createPayment(input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Product not found",
      statusCode: 404
    });
  });

  it("throws ValidationError when rounded product price is invalid", async () => {
    getProductDetailByIdMock.mockResolvedValue({ ...product, price: 0 });

    await expect(createPayment(input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Invalid product price",
      statusCode: 400
    });
  });

  it("throws ValidationError when generated order id exceeds maximum length", async () => {
    generatePaymentOrderIdMock.mockReturnValue(`KJL~${"u".repeat(60)}~abc`);

    await expect(createPayment(input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Unable to create valid order id for this user",
      statusCode: 400
    });

    expect(createSnapTransactionMock).not.toHaveBeenCalled();
  });

  it("throws ExternalServiceError and logs when Midtrans rejects transaction creation", async () => {
    createSnapTransactionMock.mockRejectedValue(new Error("midtrans rejected"));

    await expect(createPayment(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Midtrans rejected payment creation",
      statusCode: 502
    });

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "payment.midtrans.snap.create.failed",
      expect.objectContaining({
        orderId: "KJL~user-1~abc123",
        userId: "user-1",
        productId: "product-1"
      })
    );
  });

  it("throws ExternalServiceError when payment order persistence fails", async () => {
    savePaymentOrderMock.mockRejectedValue(new Error("write failed"));

    await expect(createPayment(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPayment(input)).rejects.toMatchObject({
      message: "Failed to persist payment order",
      statusCode: 502
    });
  });

  it("returns snap data and persists normalized payment order on success", async () => {
    const result = await createPayment(input);

    expect(hasActiveProductAccessMock).toHaveBeenCalledWith("user-1", "product-1");
    expect(getProductExistsByIdMock).toHaveBeenCalledWith("product-1");
    expect(getProductDetailByIdMock).toHaveBeenCalledWith("product-1");
    expect(buildSnapPayloadMock).toHaveBeenCalledWith({
      orderId: "KJL~user-1~abc123",
      amount: 199999,
      product,
      authenticatedUser: input.authenticatedUser
    });
    expect(createSnapTransactionMock).toHaveBeenCalledWith({
      payload: { transaction_details: { order_id: "KJL~user-1~abc123" } }
    });

    expect(savePaymentOrderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        PK: "PAYMENT#user-1",
        SK: "PAYMENT#KJL~user-1~abc123",
        orderId: "KJL~user-1~abc123",
        amount: 199999,
        grossAmount: "199999.00",
        status: "CREATED",
        paymentProvider: "MIDTRANS"
      })
    );

    expect(result).toEqual({
      orderId: "KJL~user-1~abc123",
      snapToken: "snap-token",
      redirectUrl: "https://pay.example/redirect"
    });
  });
});
