import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/shared/utils';

export function Section({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn(className)} {...props} />;
}