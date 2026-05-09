import { BookOpen } from 'lucide-react';

interface ProductsStateMessageProps {
  title: string;
  description: string;
}

export function ProductsStateMessage({ title, description }: ProductsStateMessageProps) {
  return (
    <div className="py-32 text-center">
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
        <BookOpen size={40} />
      </div>
      <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 font-medium">{description}</p>
    </div>
  );
}
