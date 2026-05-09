import type { LucideIcon } from 'lucide-react';
import type { AuthUser } from '@/lib/auth/types';

export interface NavLink {
  title: string;
  path: string;
  icon: LucideIcon;
  protected?: boolean;
}

export interface NavbarAuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
}