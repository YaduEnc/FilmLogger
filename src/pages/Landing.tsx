import { HeroSection } from "@/components/landing/HeroSection";
import { SignalsSection } from "@/components/landing/SignalsSection";
import { WorkSection } from "@/components/landing/WorkSection";
import { PrinciplesSection } from "@/components/landing/PrinciplesSection";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { ColophonSection } from "@/components/landing/ColophonSection";
import { SideNav } from "@/components/landing/SideNav";
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { SEOHead } from "@/components/seo/SEOHead";
import { Layout } from "@/components/layout/Layout";

export default function Landing() {
  return (
    <Layout>
      <SEOHead
        title="CineLunatic - An Archival Cinema Companion"
        description="An archival cinema companion for the obsessive film viewer. Track, rate, and discover movies and TV shows."
        type="website"
      />
      <SmoothScroll>
        <main className="relative min-h-screen selection:bg-primary selection:text-primary-foreground">
          <SideNav />
          <div className="grid-bg fixed inset-0 opacity-30 pointer-events-none" aria-hidden="true" />
          <div className="noise-overlay" aria-hidden="true" />

          <div className="relative z-10">
            <HeroSection />
            <SignalsSection />
            <WorkSection />
            <PrinciplesSection />
            <LandingPricing />
            <ColophonSection />
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}
