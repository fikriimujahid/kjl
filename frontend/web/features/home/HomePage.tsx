'use client';

import {
  CTASection,
  FeaturedProductsSection,
  FeaturesSection,
  HeroSection,
  HowItWorksSection,
  TestimonialsSection,
} from './components';

export function HomePage() {
  return (
    <div className="overflow-hidden bg-white">
      <HeroSection />
      <FeaturedProductsSection />
      <HowItWorksSection />
      <FeaturesSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}