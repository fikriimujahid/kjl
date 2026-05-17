import Link from 'next/link';
import { LogOut } from 'lucide-react';
import type { NavbarAuthState } from '@/shared/components/navbar/types';

interface UserMenuProps extends NavbarAuthState {
  onLogout: () => Promise<void>;
}

export function UserMenu({ isAuthenticated, user, onLogout }: UserMenuProps) {
  if (isAuthenticated && user) {
    return (
      <>
        <div className="text-right mr-3 hidden sm:block">
          <p className="text-[10px] font-semibold text-slate-500">Selamat Datang,</p>
          <p className="text-sm font-bold text-slate-800">{user.name}</p>
        </div>
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-bold"
        >
          {user.name.substring(0, 2).toUpperCase()}
        </Link>
        <button onClick={onLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600">
        Login
      </Link>
      <Link
        href="/register"
        className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
      >
        Daftar
      </Link>
    </div>
  );
}