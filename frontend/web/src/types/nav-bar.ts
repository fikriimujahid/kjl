import type { LucideIcon } from 'lucide-react';
import { AuthUser } from './auth';

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