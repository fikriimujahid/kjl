const PRODUCT_SERVICE_LOG_PREFIX = "productService";

export const logProductServiceInfo = (event: string, context: Record<string, unknown>) => {
  console.info(`${PRODUCT_SERVICE_LOG_PREFIX}.${event}`, context);
};
