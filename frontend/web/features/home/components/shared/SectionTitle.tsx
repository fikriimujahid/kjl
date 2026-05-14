import { cn } from '@/lib/utils';

interface SectionTitleProps {
  title: string;
  description?: string;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

export function SectionTitle({
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: SectionTitleProps) {
  return (
    <div className={className}>
      <h2 className={cn('text-3xl md:text-4xl font-black tracking-tight', titleClassName)}>{title}</h2>
      {description ? <p className={cn('font-medium text-lg', descriptionClassName)}>{description}</p> : null}
    </div>
  );
}