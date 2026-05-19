import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/utils/classnames';

export function Section({ className, ...props }: ComponentPropsWithoutRef<'div'>) {
  return <div className={cn(className)} {...props} />;
}