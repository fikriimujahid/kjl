'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, CheckCircle2, User, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { registerWithPassword } from '@/features/auth/services/api';

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  toneClassName: string;
} {
  if (!password) {
    return {
      score: 0,
      label: 'Masukkan password',
      toneClassName: 'text-gray-400',
    };
  }

  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password) || password.length >= 12) score += 1;

  if (score <= 1) {
    return {
      score,
      label: 'Password lemah. Tambahkan huruf besar, angka, atau simbol.',
      toneClassName: 'text-red-500',
    };
  }

  if (score === 2) {
    return {
      score,
      label: 'Password cukup, tapi masih bisa diperkuat.',
      toneClassName: 'text-amber-500',
    };
  }

  if (score === 3) {
    return {
      score,
      label: 'Password kuat.',
      toneClassName: 'text-emerald-500',
    };
  }

  return {
    score,
    label: 'Password sangat kuat.',
    toneClassName: 'text-emerald-600',
  };
}

export function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      await registerWithPassword(fullName, email, password);

      setLoading(false);
      setSuccess(true);
    } catch (signupError) {
      setLoading(false);
      setError(signupError instanceof Error ? signupError.message : 'Pendaftaran gagal. Silakan coba lagi.');
    }
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Cek Email Kamu!</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Kami baru saja mengirimkan email verifikasi. Silakan klik tautan di email tersebut untuk mengaktifkan akunmu.
          </p>
          <Link href="/login" className="inline-block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
            Lanjut ke Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Daftar Akun</h1>
            <p className="text-gray-500 font-medium">Bergabunglah dengan ribuan siswa lainnya.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 ml-1">Nama Lengkap</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama kamu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                />
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
            </div>

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
              <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              </div>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4].map((value) => {
                  const isActive = value <= passwordStrength.score;
                  const activeClassName =
                    passwordStrength.score <= 1
                      ? 'bg-red-400'
                      : passwordStrength.score === 2
                        ? 'bg-amber-400'
                        : 'bg-emerald-500';

                  return (
                    <div
                      key={value}
                      className={`h-1 flex-grow rounded-full transition-colors ${isActive ? activeClassName : 'bg-gray-100'}`}
                    />
                  );
                })}
              </div>
              <p className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${passwordStrength.toneClassName}`}>
                {passwordStrength.label}
              </p>
            </div>

            <button disabled={loading} type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 size={24} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                'Buka Akun Sekarang'
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-indigo-600 font-black hover:underline uppercase tracking-tight ml-1">
                Login Saja
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
