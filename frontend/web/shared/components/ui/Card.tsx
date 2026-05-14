import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

export function Card({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return (
    <div
      className={cn('bg-white border border-slate-200 shadow-sm', className)}
      {...props}
    />
  );
}