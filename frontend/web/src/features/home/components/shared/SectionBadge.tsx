import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

interface SectionBadgeProps {
  label: string;
  className?: string;
  labelClassName?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function SectionBadge({
  label,
  className,
  labelClassName,
  leftIcon,
  rightIcon,
}: SectionBadgeProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {leftIcon}
      <span className={labelClassName}>{label}</span>
      {rightIcon}
    </div>
  );
}