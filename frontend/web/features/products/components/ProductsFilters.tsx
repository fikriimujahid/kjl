import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductsFiltersProps {
  levels: string[];
  searchTerm: string;
  selectedLevel: string;
  onSearchTermChange: (value: string) => void;
  onLevelChange: (level: string) => void;
}

export function ProductsFilters({
  levels,
  searchTerm,
  selectedLevel,
  onSearchTermChange,
  onLevelChange,
}: ProductsFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-6 mb-10 items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm justify-between">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Cari program belajar..."
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-50 transition-all font-medium"
        />
      </div>

      <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 overflow-x-auto w-full md:w-auto no-scrollbar">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onLevelChange(level)}
            className={cn(
              'px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap',
              selectedLevel === level
                ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
}