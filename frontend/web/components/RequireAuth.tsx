'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'unauthenticated') {
      return;
    }

    const next = pathname ? `?next=${encodeURIComponent(pathname)}` : '';
    router.replace(`/login${next}`);
  }, [pathname, router, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 size={18} className="animate-spin" />
          Memuat sesi...
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 size={18} className="animate-spin" />
          Mengarahkan ke login...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
