import { useState } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { ProductsFilters } from '@/components/products/ProductsFilters';
import { ProductsResults } from '@/components/products/ProductsResults';
import { filterProducts, getProductLevels } from '@/utils/products';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('All');

  const { products, loading, error } = useProducts();

  const levels = getProductLevels(products);
  const filteredProducts = filterProducts(products, searchTerm, selectedLevel);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-12">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-4">Daftar Program Pembelajaran</h1>
        <p className="text-slate-500 font-medium">Pilih paket belajar yang sesuai dengan level dan target ujianmu.</p>
      </header>
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