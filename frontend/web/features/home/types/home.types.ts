export type FeatureIcon = 'zap' | 'lock' | 'smartphone' | 'check-circle';

export interface HomeFeature {
  icon: FeatureIcon;
  title: string;
  desc: string;
}

export interface HomeStat {
  value: string;
  label: string;
}

export interface HomeStep {
  num: string;
  title: string;
  desc: string;
}

export interface HomeTestimonial {
  name: string;
  role: string;
  text: string;
}