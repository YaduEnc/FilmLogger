import { Layout } from '@/components/layout/Layout';
import { SmoothScroll } from "@/components/landing/SmoothScroll";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { Mail, MapPin, Phone } from 'lucide-react';

export default function Contact() {
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
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary">Support / Assistance</span>
              <h1 className="mt-4 font-serif text-5xl md:text-7xl tracking-tight uppercase">Contact Us</h1>
              <p className="mt-6 font-mono text-sm text-muted-foreground uppercase tracking-widest max-w-xl">
                Have questions or need support? Our team is dedicated to providing you with the best experience possible.
              </p>
              <div className="mt-8 w-24 h-px bg-primary/60" />
            </header>

            <div ref={contentRef} className="space-y-24">
              <section className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="group space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl uppercase tracking-wider group-hover:text-primary transition-colors">Email Support</h2>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                    <p>For general inquiries and technical support:</p>
                    <p className="mt-2 font-bold text-foreground text-base tracking-tight">support@cinelunatic.com</p>
                  </div>
                </div>

                <div className="group space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <h2 className="font-serif text-xl uppercase tracking-wider group-hover:text-primary transition-colors">Business</h2>
                  </div>
                  <div className="font-mono text-sm text-muted-foreground leading-relaxed pl-8 border-l border-border/40">
                    <p>For partnerships and legal matters:</p>
                    <p className="mt-2 font-bold text-foreground text-base tracking-tight">+91 9220916445</p>
                  </div>
                </div>
              </section>

              <section className="group space-y-6">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-serif text-xl uppercase tracking-wider group-hover:text-primary transition-colors">Registered Office</h2>
                </div>
                <div className="relative p-10 border border-border/40 bg-card overflow-hidden">
                  {/* Subtle Grid Accent */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none grid-bg" />

                  <address className="relative z-10 not-italic font-mono text-sm text-muted-foreground leading-relaxed">
                    <p className="text-foreground/80 mb-1">CineLunatic Media</p>
                    <p>OBC - 19 Yamuna Colony</p>
                    <p>Dehradun, Uttarakhand</p>
                    <p>India — 248001</p>
                  </address>

                  <div className="absolute bottom-0 right-0 w-8 h-8 bg-background rotate-45 translate-x-5 translate-y-5 border-t border-l border-border/30" />
                </div>
              </section>

              <section className="pb-20">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-[0.2em] italic">
                  Our support team typically responds within 24-48 business hours. Thank you for your patience.
                </p>
              </section>
            </div>
          </div>
        </main>
      </SmoothScroll>
    </Layout>
  );
}
