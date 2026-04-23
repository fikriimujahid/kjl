/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, User, LogOut, ChevronRight, LayoutDashboard, Mail } from 'lucide-react';
import { cn } from '@/src/lib/utils';

// Simple Auth Context mock
const useAuth = () => {
  const [user, setUser] = useState<{ name: string } | null>({ name: 'Fikri' });
  const logout = () => setUser(null);
  return { user, logout };
};

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { title: 'Produk', path: '/products', icon: <BookOpen size={20} /> },
    { title: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={20} />, protected: true },
    { title: 'Belajarku', path: '/my-learning', icon: <ChevronRight size={20} />, protected: true },
  ];

  const filteredLinks = navLinks.filter(link => !link.protected || user);

  return (
    <nav className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-8 h-full">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
          <span className="font-bold text-xl tracking-tight text-indigo-900 hidden sm:block">KeJepangDulu</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex gap-6 h-full text-sm font-medium text-slate-600">
          {filteredLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "hover:text-indigo-600 flex items-center px-1 transition-colors border-b-2 h-full",
                location.pathname === link.path ? "border-indigo-600 text-indigo-600" : "border-transparent"
              )}
            >
              {link.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-right mr-3 hidden sm:block">
              <p className="text-[10px] font-semibold text-slate-500">Selamat Datang,</p>
              <p className="text-sm font-bold text-slate-800">{user.name}</p>
            </div>
            <Link to="/profile" className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center text-indigo-600 font-bold">
              {user.name.substring(0, 2).toUpperCase()}
            </Link>
            <button
               onClick={() => { logout(); navigate('/'); }}
               className="p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-indigo-600">
              Login
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
            >
              Daftar
            </Link>
          </div>
        )}

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
            {filteredLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block px-3 py-3 text-sm font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg flex items-center gap-3"
              >
                {link.icon}
                {link.title}
              </Link>
            ))}
            {user ? (
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                <Link
                  to="/profile"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 text-sm font-bold text-slate-700 flex items-center gap-3 rounded-lg hover:bg-slate-50"
                >
                  <User size={20} />
                  Profil Saya
                </Link>
                <button
                  onClick={() => { logout(); setIsOpen(false); navigate('/'); }}
                  className="w-full text-left px-3 py-3 text-sm font-bold text-red-600 flex items-center gap-3 rounded-lg hover:bg-red-50"
                >
                  <LogOut size={20} />
                  Logout
                </button>
              </div>
            ) : (
              <div className="pt-4 border-t border-slate-100 mt-4 space-y-4">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-bold text-slate-600 bg-slate-50 rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-3 text-sm font-bold text-white bg-indigo-600 rounded-lg shadow-sm"
                >
                  Daftar Sekarang
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
