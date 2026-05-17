import { BookOpen, LayoutDashboard } from 'lucide-react';
import type { NavLink } from '@/shared/components/navbar/types';

export const navLinks: NavLink[] = [
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