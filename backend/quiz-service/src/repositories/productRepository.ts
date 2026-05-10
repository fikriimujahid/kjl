import { CatalogProduct } from "../models/quiz";
import { isCatalogProduct } from "../utils/validators";

const DEFAULT_PRODUCT_DATA_URL = "https://kjl.fikri.dev/public-data/product.json";

const PRODUCT_DATA_URL = process.env.PRODUCT_DATA_URL ?? DEFAULT_PRODUCT_DATA_URL;

export const findSessionPassingScore = async (
  productId: string,
  topicId: string,
  sessionId: string,
  defaultPassingScore: number
): Promise<{ passingScore: number; productFound: boolean; sessionFound: boolean }> => {
  const response = await fetch(PRODUCT_DATA_URL);

  if (!response.ok) {
    throw new Error(`Failed to fetch product data: ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!Array.isArray(payload)) {
    throw new Error("Invalid product payload format");
  }

  const products = payload.filter(isCatalogProduct);
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return {
      passingScore: defaultPassingScore,
      productFound: false,
      sessionFound: false
    };
  }

  const topic = product.topics.find((item) => item.id === topicId);

  if (!topic) {
    return {
      passingScore: defaultPassingScore,
      productFound: true,
      sessionFound: false
    };
  }

  const session = topic.sessions.find((item) => item.id === sessionId);

  if (!session) {
    return {
      passingScore: defaultPassingScore,
      productFound: true,
      sessionFound: false
    };
  }

  const passingScore =
    session.passingScore ??
    product.passingScore ??
    defaultPassingScore;

  return {
    passingScore,
    productFound: true,
    sessionFound: true
  };
};
