'use client';

import { Book, FileText, Music, Play } from 'lucide-react';
import type { Session } from '@/types/product';

interface SessionTypeIconProps {
  type: Session['type'];
}

export function SessionTypeIcon({ type }: SessionTypeIconProps) {
  switch (type) {
    case 'practice':
      return <Play size={18} className="text-orange-500" />;
    case 'images':
      return <FileText size={18} className="text-red-500" />;
    case 'audio':
      return <Music size={18} className="text-blue-500" />;
    default:
      return <Book size={18} className="text-teal-500" />;
  }
}
