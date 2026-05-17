import { useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { filterProducts, getProductLevels } from '../utils/product.utils';
import { ProductsFilters } from './ProductsFilters';
import { ProductsHeader } from './ProductsHeader';
import { ProductsResults } from './ProductsResults';

export function ProductsCatalog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const { products, loading, error } = useProducts();

  const levels = getProductLevels(products);
  const filteredProducts = filterProducts(products, searchTerm, selectedLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <ProductsHeader />
      <ProductsFilters
        levels={levels}
        searchTerm={searchTerm}
        selectedLevel={selectedLevel}
        onSearchTermChange={setSearchTerm}
        onLevelChange={setSelectedLevel}
      />
      <ProductsResults loading={loading} error={error} products={filteredProducts} />
    </div>
  );
}