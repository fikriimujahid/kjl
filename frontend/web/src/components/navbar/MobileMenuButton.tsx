import { Menu, X } from 'lucide-react';

interface MobileMenuButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}

export function MobileMenuButton({ isOpen, onToggle, controlsId }: MobileMenuButtonProps) {
  return (
    <div className="md:hidden">
      <button
        onClick={onToggle}
        className="text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
        aria-expanded={isOpen}
        aria-controls={controlsId}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </div>
  );
}