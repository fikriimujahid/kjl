const PRODUCT_SERVICE_LOG_PREFIX = "productService";

export const serializeError = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    message: String(error)
  };
};

export const logProductServiceInfo = (event: string, context: Record<string, unknown>) => {
  console.info(`${PRODUCT_SERVICE_LOG_PREFIX}.${event}`, context);
};

export const logProductServiceError = (
  event: string,
  context: Record<string, unknown>,
  error: unknown
) => {
  console.error(`${PRODUCT_SERVICE_LOG_PREFIX}.${event}`, {
    ...context,
    error: serializeError(error)
  });
};
