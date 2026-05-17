import type { Product, Session, Topic } from '../types';

export function getFeaturedProducts(products: Product[]) {
  return products.filter((product) => product.featuredProducts);
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

export function filterProducts(products: Product[], searchTerm: string, selectedLevel: string): Product[] {
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  return products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(normalizedSearchTerm);
    const matchesLevel = selectedLevel === 'All' || product.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });
}

export function getSessionTypeLabel(type: Session['type']): string {
  switch (type) {
    case 'quiz':
      return 'Kuis';
    default:
      return 'Materi';
  }
}

export function getTotalSessions(topics: Topic[]): number {
  return topics.reduce((acc, topic) => acc + topic.sessions.length, 0);
}