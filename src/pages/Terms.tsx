import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";

export default function Terms() {
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
              <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">Terms of Service</h1>
              <p className="mt-6 font-mono text-xs text-muted-foreground uppercase tracking-widest">
                Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
              <div className="mt-8 w-24 h-px bg-primary/60" />
            </header>

            <div ref={contentRef} className="space-y-16">
              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">1. Acceptance of Terms</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  By accessing and using CineLunatic, you accept and agree to be bound by
                  these Terms of Service. If you do not agree to these terms, please do not
                  use our service.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">2. Description of Service</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  CineLunatic is a personal film diary and social platform for cinema lovers.
                  We provide tools to log, review, and track your film watching experience,
                  as well as connect with other film enthusiasts.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">3. User Accounts</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>To use CineLunatic, you must:</p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Be at least 13 years old</li>
                    <li><span className="text-foreground/80">—</span> Provide accurate account information</li>
                    <li><span className="text-foreground/80">—</span> Maintain the security of your account</li>
                    <li><span className="text-foreground/80">—</span> Not share your account with others</li>
                    <li><span className="text-foreground/80">—</span> Notify us of any unauthorized access</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">4. User Content</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>
                    You retain ownership of all content you create on CineLunatic. By posting
                    content, you grant us a license to display and distribute it through our
                    platform. You agree that your content:
                  </p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Does not violate any laws or regulations</li>
                    <li><span className="text-foreground/80">—</span> Does not infringe on others' intellectual property</li>
                    <li><span className="text-foreground/80">—</span> Does not contain hate speech or harassment</li>
                    <li><span className="text-foreground/80">—</span> Does not contain spam or malicious content</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">5. Prohibited Activities</h2>
                <div className="space-y-4 font-mono text-sm text-muted-foreground leading-relaxed">
                  <p>You may not:</p>
                  <ul className="space-y-3 border-l border-border/40 pl-6">
                    <li><span className="text-foreground/80">—</span> Use the service for any illegal purpose</li>
                    <li><span className="text-foreground/80">—</span> Harass, abuse, or harm other users</li>
                    <li><span className="text-foreground/80">—</span> Attempt to gain unauthorized access to our systems</li>
                    <li><span className="text-foreground/80">—</span> Scrape or collect data without permission</li>
                    <li><span className="text-foreground/80">—</span> Impersonate others or create fake accounts</li>
                    <li><span className="text-foreground/80">—</span> Distribute viruses or malicious code</li>
                  </ul>
                </div>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">6. Intellectual Property</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  The CineLunatic platform, including its design, features, and functionality,
                  is owned by us and protected by copyright and other intellectual property laws.
                  Movie data is provided by The Movie Database (TMDB) API.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">7. Termination</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account if you violate
                  these terms. You may also delete your account at any time through your
                  settings.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">8. Disclaimer</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  CineLunatic is provided "as is" without warranties of any kind. We do not
                  guarantee that the service will be uninterrupted or error-free. We are not
                  responsible for any content posted by users.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">9. Limitation of Liability</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  To the maximum extent permitted by law, CineLunatic shall not be liable
                  for any indirect, incidental, special, or consequential damages arising
                  from your use of the service.
                </p>
              </section>

              <section className="group">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">10. Changes to Terms</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  We may update these terms from time to time. We will notify you of any
                  material changes. Your continued use of the service after changes
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <section className="group pb-20">
                <h2 className="font-serif text-2xl uppercase tracking-wider mb-6 group-hover:text-primary transition-colors">11. Contact</h2>
                <p className="font-mono text-sm text-muted-foreground leading-relaxed">
                  If you have questions about these terms, please contact us through our
                  contact page.
                </p>
              </section>
            </div>
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}

