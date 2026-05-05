export const getBodyAsString = async (body: unknown): Promise<string> => {
  if (
    body &&
    typeof body === "object" &&
    "transformToString" in body &&
    typeof (body as { transformToString: unknown }).transformToString === "function"
  ) {
    return (body as { transformToString: () => Promise<string> }).transformToString();
  }

  throw new Error("Unsupported S3 object body type");
};
