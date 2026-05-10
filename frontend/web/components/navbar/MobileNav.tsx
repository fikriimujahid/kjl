import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import type { NavLink, NavbarAuthState } from '@/components/navbar/types';

interface MobileNavProps extends NavbarAuthState {
  id: string;
  isOpen: boolean;
  links: NavLink[];
  onClose: () => void;
  onLogout: () => Promise<void>;
}

export function MobileNav({ id, isOpen, links, isAuthenticated, user, onClose, onLogout }: MobileNavProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div id={id} className="md:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top duration-300">
      <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.path}
              href={link.path}
              onClick={onClose}
              className="block px-3 py-3 text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg flex items-center gap-3"
            >
              <Icon size={20} />
              {link.title}
            </Link>
          );
        })}

        {isAuthenticated && user ? (
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
            <Link
              href="/profile"
              onClick={onClose}
              className="block px-3 py-3 text-sm font-bold text-slate-700 flex items-center gap-3 rounded-lg hover:bg-slate-50"
            >
              <User size={20} />
              Profil Saya
            </Link>
            <button
              onClick={onLogout}
              className="w-full text-left px-3 py-3 text-sm font-bold text-red-600 flex items-center gap-3 rounded-lg hover:bg-red-50"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
            <Link
              href="/login"
              onClick={onClose}
              className="block w-full text-center px-4 py-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-lg"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={onClose}
              className="block w-full text-center px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-sm"
            >
              Daftar Sekarang
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}