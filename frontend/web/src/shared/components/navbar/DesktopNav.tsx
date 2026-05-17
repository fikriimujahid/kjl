import Link from 'next/link';
import type { MouseEvent } from 'react';
import { cn } from '@/shared/utils';
import type { NavLink } from '@/shared/components/navbar/types';

interface DesktopNavProps {
  links: NavLink[];
  pathname: string;
}

export function DesktopNav({ links, pathname }: DesktopNavProps) {
  const handleLinkClick = (event: MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    const hasQueryParams = typeof window !== 'undefined' && window.location.search.length > 0;

    if (targetPath === '/products' && pathname === '/products' && hasQueryParams) {
      // Force a full navigation so query params are reliably cleared in all environments.
      event.preventDefault();
      window.location.assign('/products');
    }
  };

  return (
    <div className="hidden md:flex gap-6 h-full text-sm font-medium text-slate-600">
      {links.map((link) => (
        <Link
          key={link.path}
          href={link.path}
          onClick={(event) => handleLinkClick(event, link.path)}
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