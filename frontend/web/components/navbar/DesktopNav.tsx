import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { NavLink } from '@/components/navbar/types';

interface DesktopNavProps {
  links: NavLink[];
  pathname: string;
}

export function DesktopNav({ links, pathname }: DesktopNavProps) {
  return (
    <div className="hidden md:flex gap-6 h-full text-sm font-medium text-slate-600">
      {links.map((link) => (
        <Link
          key={link.path}
          href={link.path}
          className={cn(
            'hover:text-indigo-600 flex items-center px-1 transition-colors border-b-2 h-full',
            pathname === link.path ? 'border-indigo-600 text-indigo-600' : 'border-transparent',
          )}
        >
          {link.title}
        </Link>
      ))}
    </div>
  );
}