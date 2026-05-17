'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { MOCK_USER, MOCK_PAYMENTS } from '@/shared/lib/mock-data';
import { formatPrice, cn } from '@/shared/utils';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function ProfilePage() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name ?? MOCK_USER.displayName);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!editing) {
      setDisplayName(user?.name ?? MOCK_USER.displayName);
    }
  }, [editing, user]);

  return (
    <RequireAuth>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
      <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-12 tracking-tight">Akun Saya</h1>

      <div className="space-y-12">
        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 rounded-[2rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-200">
            {MOCK_USER.displayName[0]}
          </div>

          <div className="flex-grow space-y-6 text-center md:text-left">
            <div className="space-y-1">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Informasi Dasar</p>
              {editing ? (
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-3xl font-black text-indigo-600 bg-gray-50 px-4 py-2 rounded-xl w-full border border-indigo-100"
                />
              ) : (
                <h2 className="text-3xl font-black text-gray-900">{displayName}</h2>
              )}
              <p className="text-gray-500 font-medium">{user?.email ?? MOCK_USER.email}</p>
            </div>

            <button
              onClick={() => setEditing(!editing)}
              className="px-6 py-3 bg-gray-50 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all text-sm uppercase tracking-tight"
            >
              {editing ? 'Simpan Perubahan' : 'Ubah Nama'}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="text-indigo-600" size={28} />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight text-center md:text-left">Riwayat Pembayaran</h2>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {MOCK_PAYMENTS.map((payment) => (
              <div key={payment.id} className="p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-6 w-full sm:w-auto">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
                    payment.status === 'Success' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600',
                  )}>
                    {payment.status === 'Success' ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight mb-1">{payment.productName}</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{payment.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8 w-full sm:w-auto justify-between sm:justify-end">
                  <p className="text-lg font-black text-gray-900">{formatPrice(payment.amount)}</p>
                  <div className={cn(
                    'px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border',
                    payment.status === 'Success'
                      ? 'bg-teal-50 text-teal-600 border-teal-100'
                      : 'bg-red-50 text-red-600 border-red-100',
                  )}>
                    {payment.status === 'Success' ? 'LUNAS' : 'GAGAL'}
                  </div>
                  <button className="text-gray-300 hover:text-indigo-600 transition-colors hidden md:block">
                    <ChevronRight size={24} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </div>
    </RequireAuth>
  );
}
