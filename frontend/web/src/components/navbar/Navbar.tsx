'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DesktopNav } from '@/components/navbar/DesktopNav';
import { MobileMenuButton } from '@/components/navbar/MobileMenuButton';
import { MobileNav } from '@/components/navbar/MobileNav';
import { UserMenu } from '@/components/navbar/UserMenu';
import { NavLink } from '@/types/nav-bar';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';

const MOBILE_MENU_ID = 'navbar-mobile-menu';

export function Navbar() {
  const navLinks: NavLink[] = [
    {
      title: 'Produk',
      path: '/products',
      icon: BookOpen,
    },
    {
      title: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      protected: true,
    },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = status === 'authenticated' && Boolean(user);

  const filteredLinks = useMemo(() => {
    return navLinks.filter((link) => !link.protected || status === 'authenticated');
  }, [status]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    router.push('/');
  };

  return (
    <nav className="h-16 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-sm">
      <div className="flex items-center gap-8 h-full">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">K</div>
          <span className="font-bold text-xl tracking-tight text-indigo-900 hidden sm:block">KeJepangDulu</span>
        </Link>
        <DesktopNav links={filteredLinks} pathname={pathname} />
      </div>

      <div className="flex items-center gap-4">
        <UserMenu isAuthenticated={isAuthenticated} user={user} onLogout={handleLogout} />
        <MobileMenuButton
          isOpen={isOpen}
          onToggle={() => setIsOpen((open) => !open)}
          controlsId={MOBILE_MENU_ID}
        />
      </div>

      <MobileNav
        id={MOBILE_MENU_ID}
        isOpen={isOpen}
        links={filteredLinks}
        pathname={pathname}
        isAuthenticated={isAuthenticated}
        user={user}
        onClose={() => setIsOpen(false)}
        onLogout={handleLogout}
      />
    </nav>
  );
}