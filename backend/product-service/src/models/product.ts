export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  shortDescription: string;
  level: 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'JFT' | 'Beginner';
  topicsCount: number;
  featuredProducts?: boolean;
  accessDurationDays: number;
  topics: Topic[];
}

export interface Topic {
  id: string;
  title: string;
  sessions: Session[];
}

export interface Session {
  id: string;
  title: string;
  type: 'quiz' | 'pdf' | 'audio' | 'images' | 'video';
  contentUrl?: string;
}

export interface ProductSummary {
  id: string;
  name: string;
  price: number;
}

