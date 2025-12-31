import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Privacy() {
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current || !headerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        headerRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out" }
      );

      const sections = contentRef.current?.querySelectorAll("section");
      if (sections) {
        gsap.fromTo(
          sections,
          { y: 20, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.1,
            ease: "power3.out",
            delay: 0.3
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <Layout>
      <SmoothScroll>
        <main className="relative min-h-screen selection:bg-primary selection:text-primary-foreground overflow-hidden">
          <div className="grid-bg fixed inset-0 opacity-20 pointer-events-none" aria-hidden="true" />
          <div className="noise-overlay" aria-hidden="true" />

          <div className="relative z-10 container mx-auto px-6 md:px-28 py-32 max-w-5xl">
            <header ref={headerRef} className="mb-20">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Legal / Governance</span>
              <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">Privacy Policy</h1>
              <p className="mt-6 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="mt-8 w-24 h-px bg-primary/60" />
            </header>

            <div ref={contentRef} className="space-y-16">
              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">What We Collect</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>We collect only the information necessary to provide you with the best experience:</p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Account information (email, display name, profile photo)</li>
                    <li><span className="text-foreground/80">—</span> Your film diary entries (logs, ratings, reviews)</li>
                    <li><span className="text-foreground/80">—</span> Lists and watchlists you create</li>
                    <li><span className="text-foreground/80">—</span> Social interactions (connections, messages, comments)</li>
                    <li><span className="text-foreground/80">—</span> Usage data to improve our service</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">How We Use Your Data</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>Your data is used to:</p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Provide and maintain the CineLunatic service</li>
                    <li><span className="text-foreground/80">—</span> Generate your personal statistics and insights</li>
                    <li><span className="text-foreground/80">—</span> Enable social features (if you choose to use them)</li>
                    <li><span className="text-foreground/80">—</span> Improve and optimize our platform</li>
                    <li><span className="text-foreground/80">—</span> Communicate important updates</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Your Privacy Rights</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>You have complete control over your data:</p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Access and download all your data</li>
                    <li><span className="text-foreground/80">—</span> Edit or delete any content you've created</li>
                    <li><span className="text-foreground/80">—</span> Control your privacy settings</li>
                    <li><span className="text-foreground/80">—</span> Delete your account at any time</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Data Security</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  We use industry-standard security measures to protect your data.
                  Your information is stored securely using Firebase, Google's trusted
                  cloud platform. We never sell your data to third parties.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Cookies</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  We use essential cookies to maintain your session and preferences.
                  We do not use tracking cookies or third-party advertising cookies.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Changes to This Policy</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  We may update this policy from time to time. We'll notify you of
                  any significant changes via email or through the platform.
                </p>
              </section>

              <section className="group pb-20">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">Contact Us</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  If you have questions about this privacy policy, please contact us
                  through our contact page.
                </p>
              </section>
            </div>
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}

