import { getCreatePaymentEnv, getWebhookEnv } from "../../src/config/env";
import { ValidationError } from "../../src/errors/applicationErrors";

describe("payment env config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = {
      ...ORIGINAL_ENV,
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://api.midtrans.test/snap",
      APP_BASE_URL: "https://app.kjl.test/"
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns create payment env and normalizes app base URL", () => {
    const env = getCreatePaymentEnv();

    expect(env).toEqual({
      dynamoDbTableName: "kjl-table",
      midtransServerKey: "midtrans-key",
      midtransSnapApiUrl: "https://api.midtrans.test/snap",
      appBaseUrl: "https://app.kjl.test"
    });
  });

  it("uses empty appBaseUrl when APP_BASE_URL is not set", () => {
    delete process.env.APP_BASE_URL;

    const env = getCreatePaymentEnv();

    expect(env.appBaseUrl).toBe("");
  });

  it("throws when DYNAMO_DB_TABLE_NAME is missing", () => {
    delete process.env.DYNAMO_DB_TABLE_NAME;

    expect(() => getCreatePaymentEnv()).toThrow(ValidationError);
    expect(() => getCreatePaymentEnv()).toThrow("Missing DYNAMO_DB_TABLE_NAME environment variable");
  });

  it("throws when MIDTRANS_SERVER_KEY is missing", () => {
    delete process.env.MIDTRANS_SERVER_KEY;

    expect(() => getCreatePaymentEnv()).toThrow(ValidationError);
    expect(() => getCreatePaymentEnv()).toThrow("Missing MIDTRANS_SERVER_KEY environment variable");
  });

  it("throws when MIDTRANS_SNAP_API_URL is missing", () => {
    delete process.env.MIDTRANS_SNAP_API_URL;

    expect(() => getCreatePaymentEnv()).toThrow(ValidationError);
    expect(() => getCreatePaymentEnv()).toThrow("Missing MIDTRANS_SNAP_API_URL environment variable");
  });

  it("returns webhook env with shared required fields", () => {
    const env = getWebhookEnv();

    expect(env).toEqual({
      dynamoDbTableName: "kjl-table",
      midtransServerKey: "midtrans-key"
    });
  });
});
