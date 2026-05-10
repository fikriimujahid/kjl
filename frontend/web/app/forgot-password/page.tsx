'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Mail, ShieldCheck, KeyRound, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { confirmPasswordReset, requestPasswordReset } from '@/lib/auth/api';

type ForgotPasswordOperation = 'request' | 'confirm';

function getForgotPasswordErrorMessage(operation: ForgotPasswordOperation, fallbackMessage?: string): string {
  if (fallbackMessage && fallbackMessage.trim().length > 0) {
    return fallbackMessage;
  }

  if (operation === 'request') {
    return 'Gagal mengirim kode reset. Silakan coba lagi.';
  }

  return 'Gagal mengubah password. Silakan coba lagi.';
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const requestResetCode = async (): Promise<void> => {
    setLoading(true);
    setError('');
    setInfo('');

    try {
      await requestPasswordReset(email);

      setIsCodeSent(true);
      setInfo('Kode verifikasi sudah dikirim ke email kamu. Masukkan kode tersebut beserta password baru.');
    } catch (requestError) {
      setError(
        getForgotPasswordErrorMessage('request', requestError instanceof Error ? requestError.message : undefined),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    await requestResetCode();
  };

  const handleConfirmReset = async (event: React.FormEvent) => {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      await confirmPasswordReset(email, code, newPassword);

      setIsSuccess(true);
    } catch (confirmError) {
      setError(
        getForgotPasswordErrorMessage('confirm', confirmError instanceof Error ? confirmError.message : undefined),
      );
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-gray-100"
        >
          <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Password Berhasil Diubah</h1>
          <p className="text-gray-500 font-medium leading-relaxed mb-8">
            Password akun kamu sudah diperbarui. Sekarang kamu bisa login menggunakan password baru.
          </p>
          <Link
            href="/login"
            className="inline-block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Lanjut ke Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden"
      >
        <div className="p-8 md:p-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-2">Lupa Password</h1>
            <p className="text-gray-500 font-medium">
              {!isCodeSent
                ? 'Masukkan email akun kamu untuk menerima kode reset.'
                : 'Masukkan kode verifikasi dan password baru kamu.'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-600 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {info && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm font-medium">
              {info}
            </div>
          )}

          {!isCodeSent ? (
            <form onSubmit={handleRequestReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                    Mengirim Kode...
                  </>
                ) : (
                  'Kirim Kode Reset'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleConfirmReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                  />
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Kode Verifikasi</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Masukkan kode 6 digit"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                  />
                  <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Password Baru</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={8}
                    placeholder="Minimal 8 karakter"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all font-medium text-gray-900"
                  />
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
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
                    Menyimpan Password...
                  </>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>

              <button
                type="button"
                onClick={requestResetCode}
                disabled={loading}
                className="w-full py-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
              >
                Kirim Ulang Kode
              </button>
            </form>
          )}

          <div className="mt-8 pt-8 border-t border-gray-50 text-center">
            <p className="text-sm text-gray-500 font-medium">
              Sudah ingat password?{' '}
              <Link href="/login" className="text-indigo-600 font-black hover:underline uppercase tracking-tight ml-1">
                Kembali ke Login
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}