import { Product } from "@/types/product";

export function filterProducts(products: Product[], searchTerm: string, selectedLevel: string): Product[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(normalizedSearchTerm);
    const matchesLevel = selectedLevel === 'All' || product.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });
}

export function getProductLevels(products: Product[]): string[] {
  const levels = new Set<string>();

  for (const product of products) {
    if (product.level?.trim()) {
      levels.add(product.level);
    }
  }

  return ['All', ...Array.from(levels)];
}