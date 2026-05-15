export const logger = {
  error: (...args: Parameters<typeof console.error>): void => {
    console.error(...args);
  }
};