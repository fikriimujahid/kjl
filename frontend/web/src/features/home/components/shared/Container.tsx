import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return <div className={cn('max-w-7xl mx-auto relative z-10', className)}>{children}</div>;
}