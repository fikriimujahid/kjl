import { clearEnvCache, getPaymentServiceEnv } from "../../src/config/env";
import { ValidationError } from "../../src/errors/applicationErrors";

describe("payment env config", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => { clearEnvCache();
    process.env = {
      ...ORIGINAL_ENV,
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://api.midtrans.test/snap",
      APP_BASE_URL: "https://app.kjl.test/",
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test/",
      INTERNAL_SERVICE_API_KEY: "internal-secret"
    };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it("returns payment env and normalizes app base URL", () => {
    const env = getPaymentServiceEnv();

    expect(env).toEqual({
      DYNAMO_DB_TABLE_NAME: "kjl-table",
      MIDTRANS_SERVER_KEY: "midtrans-key",
      MIDTRANS_SNAP_API_URL: "https://api.midtrans.test/snap",
      APP_BASE_URL: "https://app.kjl.test",
      PRODUCT_SERVICE_INTERNAL_API_BASE_URL: "https://service-api.kjl.test",
      INTERNAL_SERVICE_API_KEY: "internal-secret"
    });
  });

  it("uses empty APP_BASE_URL when APP_BASE_URL is not set", () => {
    delete process.env.APP_BASE_URL;

    const env = getPaymentServiceEnv();

    expect(env.APP_BASE_URL).toBe("");
  });

  it("throws when DYNAMO_DB_TABLE_NAME is missing", () => {
    delete process.env.DYNAMO_DB_TABLE_NAME;

    expect(() => getPaymentServiceEnv()).toThrow(ValidationError);
    expect(() => getPaymentServiceEnv()).toThrow("Missing DYNAMO_DB_TABLE_NAME environment variable");
  });

  it("throws when MIDTRANS_SERVER_KEY is missing", () => {
    delete process.env.MIDTRANS_SERVER_KEY;

    expect(() => getPaymentServiceEnv()).toThrow(ValidationError);
    expect(() => getPaymentServiceEnv()).toThrow("Missing MIDTRANS_SERVER_KEY environment variable");
  });

  it("throws when MIDTRANS_SNAP_API_URL is missing", () => {
    delete process.env.MIDTRANS_SNAP_API_URL;

    expect(() => getPaymentServiceEnv()).toThrow(ValidationError);
    expect(() => getPaymentServiceEnv()).toThrow("Missing MIDTRANS_SNAP_API_URL environment variable");
  });

  it("throws when PRODUCT_SERVICE_INTERNAL_API_BASE_URL is missing", () => {
    delete process.env.PRODUCT_SERVICE_INTERNAL_API_BASE_URL;

    expect(() => getPaymentServiceEnv()).toThrow(ValidationError);
    expect(() => getPaymentServiceEnv()).toThrow("Missing PRODUCT_SERVICE_INTERNAL_API_BASE_URL environment variable");
  });

  it("throws when INTERNAL_SERVICE_API_KEY is missing", () => {
    delete process.env.INTERNAL_SERVICE_API_KEY;

    expect(() => getPaymentServiceEnv()).toThrow(ValidationError);
    expect(() => getPaymentServiceEnv()).toThrow("Missing INTERNAL_SERVICE_API_KEY environment variable");
  });
});

