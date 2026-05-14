import { Product } from "../types/productTypes";
import { isProduct } from "../utils/validators";

export const mapProductItem = (item: unknown): Product | null => {
  if (!isProduct(item)) {
    return null;
  }

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    shortDescription: item.shortDescription,
    level: item.level,
    topicsCount: item.topicsCount,
    featuredProducts: item.featuredProducts,
    accessDurationDays: item.accessDurationDays
  };
};
