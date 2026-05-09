
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '@/hooks/useAuth';
import { loginWithPassword } from '@/lib/auth/api';

function normalizeNextPath(nextPath: string | null): string {
  if (!nextPath) {
    return '/dashboard';
  }

  if (!nextPath.startsWith('/') || nextPath.startsWith('//')) {
    return '/dashboard';
  }

  return nextPath;
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nextPath, setNextPath] = useState('/dashboard');
  const { login, status } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setNextPath(normalizeNextPath(params.get('next')));
  }, []);

  React.useEffect(() => {
    if (status !== 'authenticated') {
      return;
    }

    router.replace(nextPath);
  }, [nextPath, router, status]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      const nextSession = await loginWithPassword(email, password);
      login(nextSession);

      router.push(nextPath);
    } catch (loginError) {
      setLoading(false);
      setError(loginError instanceof Error ? loginError.message : 'Login gagal. Silakan coba lagi.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Masuk ke Akun</h1>
            <p className="text-gray-500 font-medium">Lanjutkan progres belajarmu hari ini.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-gray-700">Password</label>
                <Link href="/forgot-password" className="text-xs font-bold text-indigo-600 hover:underline">Lupa Password?</Link>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Memproses...
                </>
              ) : (
                'Masuk Sekarang'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Belum punya akun?{' '}
              <Link href="/register" className="text-indigo-600 font-black hover:underline uppercase tracking-tight ml-1">
                Daftar Gratis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}