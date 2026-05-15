import {
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  ValidationError
} from "../../src/errors/applicationErrors";
import { createPaymentUseCase } from "../../src/use-cases/createPaymentUseCase";
import { generatePaymentOrderId } from "../../src/domain/payment/generatePaymentOrderId";
import { buildSnapPayload } from "../../src/services/midtrans/buildSnapPayload";
import { createSnapTransaction } from "../../src/services/midtransService";
import { hasActiveProductAccess, savePaymentOrder } from "../../src/services/paymentRepository";
import { fetchProductById } from "../../src/services/productService";
import { logger } from "../../src/utils/logger";

jest.mock("../../src/services/paymentRepository", () => ({
  hasActiveProductAccess: jest.fn(),
  savePaymentOrder: jest.fn()
}));

jest.mock("../../src/services/productService", () => ({
  fetchProductById: jest.fn()
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

jest.mock("../../src/utils/logger", () => ({
  logger: {
    error: jest.fn()
  }
}));

describe("createPaymentUseCase", () => {
  const hasActiveProductAccessMock = hasActiveProductAccess as jest.MockedFunction<typeof hasActiveProductAccess>;
  const fetchProductByIdMock = fetchProductById as jest.MockedFunction<typeof fetchProductById>;
  const createSnapTransactionMock = createSnapTransaction as jest.MockedFunction<typeof createSnapTransaction>;
  const savePaymentOrderMock = savePaymentOrder as jest.MockedFunction<typeof savePaymentOrder>;
  const generatePaymentOrderIdMock = generatePaymentOrderId as jest.MockedFunction<typeof generatePaymentOrderId>;
  const buildSnapPayloadMock = buildSnapPayload as jest.MockedFunction<typeof buildSnapPayload>;
  const loggerErrorMock = logger.error as jest.MockedFunction<typeof logger.error>;

  const input = {
    env: {
      dynamoDbTableName: "kjl-table",
      midtransServerKey: "midtrans-key",
      midtransSnapApiUrl: "https://snap.midtrans.test",
      appBaseUrl: "https://app.kjl.test"
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
    fetchProductByIdMock.mockResolvedValue(product);
    generatePaymentOrderIdMock.mockReturnValue("KJL~user-1~abc123");
    buildSnapPayloadMock.mockReturnValue({ transaction_details: { order_id: "KJL~user-1~abc123" } });
    createSnapTransactionMock.mockResolvedValue({ token: "snap-token", redirectUrl: "https://pay.example/redirect" });
    savePaymentOrderMock.mockResolvedValue(undefined);
  });

  it("throws ConflictError when user already has active product access", async () => {
    hasActiveProductAccessMock.mockResolvedValue(true);

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ConflictError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "User already has the product",
      statusCode: 409
    });

    expect(fetchProductByIdMock).not.toHaveBeenCalled();
  });

  it("throws ExternalServiceError when active access check fails", async () => {
    hasActiveProductAccessMock.mockRejectedValue(new Error("dynamo down"));

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Failed to validate existing product access",
      statusCode: 502
    });
  });

  it("throws ExternalServiceError when product lookup fails", async () => {
    fetchProductByIdMock.mockRejectedValue(new Error("network error"));

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Failed to load product data",
      statusCode: 502
    });
  });

  it("throws NotFoundError when product does not exist", async () => {
    fetchProductByIdMock.mockResolvedValue(null);

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(NotFoundError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Product not found",
      statusCode: 404
    });
  });

  it("throws ValidationError when rounded product price is invalid", async () => {
    fetchProductByIdMock.mockResolvedValue({ ...product, price: 0 });

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Invalid product price",
      statusCode: 400
    });
  });

  it("throws ValidationError when generated order id exceeds maximum length", async () => {
    generatePaymentOrderIdMock.mockReturnValue(`KJL~${"u".repeat(60)}~abc`);

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ValidationError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Unable to create valid order id for this user",
      statusCode: 400
    });

    expect(createSnapTransactionMock).not.toHaveBeenCalled();
  });

  it("throws ExternalServiceError and logs when Midtrans rejects transaction creation", async () => {
    createSnapTransactionMock.mockRejectedValue(new Error("midtrans rejected"));

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Midtrans rejected payment creation",
      statusCode: 502
    });

    expect(loggerErrorMock).toHaveBeenCalledWith(
      "[MIDTRANS_SNAP_CREATE_FAILED]",
      expect.objectContaining({
        orderId: "KJL~user-1~abc123",
        userId: "user-1",
        productId: "product-1"
      })
    );
  });

  it("throws ExternalServiceError when payment order persistence fails", async () => {
    savePaymentOrderMock.mockRejectedValue(new Error("write failed"));

    await expect(createPaymentUseCase(input)).rejects.toBeInstanceOf(ExternalServiceError);
    await expect(createPaymentUseCase(input)).rejects.toMatchObject({
      message: "Failed to persist payment order",
      statusCode: 502
    });
  });

  it("returns snap data and persists normalized payment order on success", async () => {
    const result = await createPaymentUseCase(input);

    expect(hasActiveProductAccessMock).toHaveBeenCalledWith("kjl-table", "user-1", "product-1");
    expect(fetchProductByIdMock).toHaveBeenCalledWith("product-1", "kjl-table");
    expect(buildSnapPayloadMock).toHaveBeenCalledWith({
      orderId: "KJL~user-1~abc123",
      amount: 199999,
      product,
      authenticatedUser: input.authenticatedUser,
      appBaseUrl: "https://app.kjl.test"
    });
    expect(createSnapTransactionMock).toHaveBeenCalledWith({
      serverKey: "midtrans-key",
      snapApiUrl: "https://snap.midtrans.test",
      payload: { transaction_details: { order_id: "KJL~user-1~abc123" } }
    });

    expect(savePaymentOrderMock).toHaveBeenCalledWith(
      "kjl-table",
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
