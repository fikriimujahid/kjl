/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Twitter, Mail, HelpCircle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link to="/" className="text-2xl font-bold text-white tracking-tight block mb-4">
            KeJepangDulu
          </Link>
          <p className="max-w-md text-gray-400 leading-relaxed mb-6">
            Misi kami adalah membantu Anda meraih skor impian di ujian JLPT & JFT dengan materi yang terstruktur dan metode belajar yang modern.
          </p>
          <div className="flex space-x-5">
            <a href="#" className="hover:text-indigo-400 transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-indigo-400 transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-indigo-400 transition-colors"><Mail size={20} /></a>
          </div>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Tautan Cepat</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/products" className="hover:text-indigo-400 transition-colors">Semua Produk</Link></li>
            <li><Link to="/register" className="hover:text-indigo-400 transition-colors">Daftar Akun</Link></li>
            <li><Link to="/faq" className="hover:text-indigo-400 transition-colors flex items-center gap-2"><HelpCircle size={14} /> Bantuan & FAQ</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Informasi</h3>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Tentang Kami</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Syarat & Ketentuan</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition-colors">Kebijakan Privasi</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} KeJepangDulu. Hak Cipta Dilindungi Undang-Undang.</p>
      </div>
    </footer>
  );
};
