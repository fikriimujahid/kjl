import { BookOpen, HelpCircle } from 'lucide-react';
import { Session } from '@/lib/types';

interface SessionTypeIconProps {
  type: Session['type'];
}

export function SessionTypeIcon({ type }: SessionTypeIconProps) {
  const props = { size: 14, className: 'shrink-0' };

  switch (type) {
    case 'quiz':
      return <HelpCircle {...props} />;
    default:
      return <BookOpen {...props} />;
  }
}
